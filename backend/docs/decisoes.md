# Registro de Decisões de Arquitetura (ADR) - SGPI 2.0

## 1. Mudança de Escopo (Pivot)
**Data:** 01/02/2026
**Decisão:** Alterar o foco de "Sistema Acadêmico Completo" para "Sistema de Gestão Eletrônica de Documentos (GED)".
**Motivação:**
- Complexidade excessiva na gestão de alunos/turmas no modelo anterior.
- Necessidade crítica da coordenação: centralização e segurança de arquivos (backup contra perda de dados físicos).
- Foco na entrega de valor imediato: Rastreabilidade de uploads por professores.

## 2. Banco de Dados Relacional
**Data:** 01/02/2026
**Decisão:** Uso do **MySQL**.
**Motivação:**
- Compatibilidade com o ambiente de desenvolvimento atual.
- Estrutura relacional é necessária para vincular Usuários -> Pastas -> Documentos.
- Uso da biblioteca `mysql2` com Promises para suporte a `async/await`.

## 3. Armazenamento de Arquivos
**Data:** 01/02/2026
**Decisão:** Estratégia Híbrida (Google Drive API).
**Motivação:**
- Reaproveitamento do módulo de OAuth2 já desenvolvido e estável.
- Custo zero de armazenamento para a instituição (contas educacionais).
- Facilidade de acesso externo pelo Coordenador.

## 4. Estrutura de Pastas e Nomenclatura
**Data:** 01/02/2026
**Decisão:** Adoção de arquitetura em camadas (Layered Architecture) com injeção de dependência manual.
**Camadas:**
- `Routes`: Entrada HTTP.
- `Controllers`: Validação e Orquestração.
- `Services`: Regras de Negócio.
- `Repositories`: Acesso a Dados (SQL).

## 5. Estratégia de Autenticação e Segurança
**Data:** 01/02/2026
**Decisão:** Uso de **JWT (JSON Web Tokens)** com **BcryptJS**.
**Motivação:**
- **Stateless:** Não onera a memória do servidor guardando sessões, ideal para APIs REST escaláveis.
- **Segurança da Senha:** O uso de `bcrypt` com `salt` impede ataques de rainbow table, garantindo que a senha nunca seja salva em texto plano.
- **Payload:** O token carrega o ID e a Role (papel) do usuário, facilitando a verificação de permissões sem consultar o banco a todo momento.

## 6. Proteção de Rotas e Contexto de Usuário
**Data:** 01/02/2026
**Decisão:** Uso de Middleware dedicado (`authMiddleware`) para validação de JWT.
**Motivação:**
- **Segurança Centralizada:** Garante que a lógica de verificação de token esteja em um único lugar. Se precisarmos mudar a chave secreta ou o algoritmo de criptografia, alteramos apenas um arquivo.
- **Injeção de Dependência:** O middleware é responsável por identificar *quem* é o usuário e anexar essa informação (`req.userId`) ao objeto da requisição, permitindo que os Controllers foquem apenas na regra de negócio sem se preocupar em "decifrar" tokens.
- **Padrão Bearer:** Adoção do padrão standard de mercado `Authorization: Bearer <token>`.

## 7. Estratégia de Hierarquia de Pastas (Drive)
**Data:** 01/02/2026
**Decisão:** Espelhamento automático da estrutura acadêmica.
**Motivação:**
- Para evitar desorganização no Google Drive, o sistema impõe uma estrutura rígida: `Semestre (Raiz) > Disciplina > Pacote de Entrega`.
- O sistema verifica a existência de cada nível antes de criar o próximo. Se a pasta "2025_1" não existir, ela é criada. Se "Designer Digital" não existir dentro de "2025_1", é criada.
- Isso remove a responsabilidade do usuário de organizar arquivos e garante padronização para o backup futuro.

## 8. Estratégia de Upload Assíncrono (Fila)
**Data:** 01/02/2026
**Decisão:** Implementação do padrão Producer-Consumer usando tabela de banco de dados (`documents` status) e um Worker rodando no próprio processo Node.js.
**Motivação:**
- **Resiliência:** Uploads para o Google Drive podem demorar ou falhar. Não podemos deixar o navegador do usuário travado esperando.
- **Simplicidade (KISS):** Ao usar o MySQL como fila (Status: PENDING -> UPLOADING -> COMPLETED), evitamos a complexidade de configurar o Redis/RabbitMQ, mantendo a infraestrutura leve.
- **Recuperação:** Se o servidor reiniciar no meio de um upload, o Worker verifica o banco na inicialização e retoma/reprocessa os arquivos pendentes.

## 9. Estratégia de Download (Streaming ZIP)
**Data:** 01/02/2026
**Decisão:** Geração de arquivos .zip em tempo real (On-the-fly) usando Streams.
**Motivação:**
- **Performance:** Baixar todos os arquivos do Drive para o disco do servidor antes de entregar ao usuário causaria latência alta e consumo excessivo de disco/memória.
- **Solução:** Utilizamos a biblioteca `archiver` conectada via Pipe (`.pipe()`) diretamente à resposta HTTP. O servidor atua apenas como um "tubo", pegando os bytes do Google Drive, compactando e enviando ao navegador simultaneamente.

## 10. Política de Exclusão e Permissões
**Data:** 01/02/2026
**Decisão:** Deleção física de arquivos e lógica de permissões rígida.
**Motivação:**
- **Permissões:** Apenas o **Coordenador** (Admin) ou o **Dono do Arquivo** (Professor que fez upload) podem deletar um documento. Isso impede sabotagem entre professores.
- **Drive:** Arquivos deletados via sistema são movidos para a **Lixeira** do Google Drive (`trashed: true`) em vez de excluídos permanentemente, permitindo recuperação manual em caso de acidente (Safety Net).
- **Local:** Arquivos temporários locais são removidos fisicamente (`fs.unlink`) para não lotar o servidor.

## 11. Automação de Manutenção (Cron Jobs)
**Data:** 01/02/2026
**Decisão:** Uso de tarefas agendadas (`node-cron`) para manutenção do sistema.
**Motivação:**
- **Ciclo de Vida do Semestre:** Para evitar dependência humana, o sistema verifica datas de corte (ex: 15/07) e cria automaticamente as pastas do próximo semestre no Drive e no Banco.
- **Limpeza de Disco:** Um serviço de limpeza remove arquivos temporários da pasta `uploads/` que tenham mais de 1 hora, prevenindo vazamento de armazenamento em caso de falhas no Worker.

## 12. Segurança de Cadastro (2FV)
**Data:** 01/02/2026
**Decisão:** Implementação de verificação de e-mail obrigatória antes do primeiro login.
**Motivação:**
- **Integridade:** Evita cadastros de bots ou uso de e-mails de terceiros incorretamente.
- **Fluxo:** O usuário se cadastra -> Recebe Token (6 dígitos) -> Valida na API -> Acesso liberado.
- **Bloqueio:** O endpoint de login rejeita (`403 Forbidden`) qualquer conta com `is_verified = 0`.

## 13. Exposição de Metadados
**Data:** 01/02/2026
**Decisão:** Criação de endpoints públicos (para usuários logados) de listas auxiliares.
**Motivação:**
- **Frontend Driven:** O Frontend não deve ter IDs "hardcoded". Ele deve consultar a API para saber quais disciplinas (`/metadata/disciplines`) e qual semestre (`/metadata/semester`) estão disponíveis, garantindo dinamismo se o banco mudar.

## 13. Recuperação de Acesso (Self-Service)
**Data:** 02/02/2026
**Decisão:** Implementação de fluxo de "Esqueci minha senha" via Token de E-mail.
**Motivação:**
- **Autonomia:** Reduz a carga sobre o coordenador. O próprio professor pode resetar sua senha.
- **Segurança:** O token de reset tem validade curta (1 hora) e é invalidado imediatamente após o uso.
- **Resiliência:** Implementação de endpoint de reenvio de código de verificação para contornar falhas de entrega de e-mail.

## 14. Política de Retenção Legal (Regra dos 5 Anos)
**Data:** 02/02/2026
**Decisão:** Bloqueio sistêmico na exclusão de Pastas de Entrega (Submission Folders).
**Motivação:**
- **Compliance:** O curso de DSM exige a guarda de documentos por 5 anos.
- **Segurança:** O sistema impede que um Coordenador apague acidentalmente um semestre recente.
- **Exceção:** A exclusão é permitida se a pasta tiver menos de 5 anos MAS estiver **vazia** (sem arquivos vinculados), caracterizando um erro de criação ou pasta de teste.

## 15. Fluxo de Cadastro e Reciclagem de Contas
**Data:** 02/02/2026
**Decisão:** Implementação de lógica de "Upsert" (Atualização) para cadastros não verificados.
**Contexto:**
- Usuários podiam ficar "presos" se o cadastro inicial falhasse antes da validação do token (erro de duplicidade de e-mail).
**Solução Técnica:**
- Se um e-mail já existe no banco mas `is_verified = 0`:
    1. O sistema não retorna erro.
    2. Atualiza a senha (hash) e gera um novo token.
    3. Reenvia o e-mail.
- **Padronização de Senha:** A criptografia (`bcrypt`) foi movida exclusivamente para o *Controller*. O *Repository* apenas persiste o dado na coluna `password_hash`.


**Data:** 09/02/2026
### Novas Funcionalidades (Gestão de Pastas)
- **GET /api/folders/my-folders**: Lista apenas as pastas criadas pelo professor logado (com contagem de arquivos).
- **PUT /api/folders/:id**: Permite renomear o título da entrega (Sincroniza Banco + Google Drive).
- **DELETE /api/folders/:id**: Exclusão lógica e física. Remove do banco e move a pasta do Drive para a Lixeira.
  - *Regra de Negócio:* Apenas o dono da pasta pode editar/excluir.

### Ajustes de Arquitetura
- **Listagem de Disciplinas (`/api/metadata/disciplines`)**: 
  - Alterado para listar a tabela `disciplines` completa em vez de `submission_folders`.
  - Motivo: Permitir que o professor selecione matérias mesmo que ainda não existam pastas criadas para elas no semestre atual (Lógica *Lazy Creation*).

## [10/02/2026] Estratégia de Sanitização de Arquivos e Upload
**Contexto:**
Houve problemas recorrentes com arquivos contendo caracteres especiais (acentos, cedilha, emojis) corrompendo nomes no Banco de Dados ou no Google Drive, gerando erros de codificação na API. Tentativas de sanitização puramente no Backend resultaram em duplicidade de lógica e persistência de erros em alguns fluxos.

**Decisão:**
1. **Bloqueio no Frontend (Porteiro):** Implementada validação estrita no React (`Dropzone`). O usuário é impedido de enviar arquivos com nomes fora do padrão `[a-zA-Z0-9._-]`.
2. **Fallback no Backend:** Mantivemos a função `sanitizeFilename` no Worker e Controllers como segurança redundante, caso a validação do front seja burlada, mas a "fonte da verdade" é a prevenção no client-side.
3. **Links como Arquivos:** Links externos (YouTube/GitHub) são convertidos em arquivos `.html` (redirecionamento) no Frontend antes do envio, permitindo que o sistema os trate como qualquer outro arquivo no fluxo do Google Drive.

## [11/02/2026] Escopo do Dashboard do Coordenador (MVP)
**Contexto:**
Inicialmente, o design previa gráficos de progresso de alunos e conformidade de tarefas. Porém, na versão 1.0 (MVP), o sistema foca no recebimento e armazenamento seguro dos arquivos, sem gestão granular de tarefas/prazos de alunos individuais.

**Decisão:**
1. **Remoção de Métricas Fictícias:** Removemos os gráficos de pizza e contagem de "Alunos" do dashboard, pois esses dados não existem no modelo atual.
2. **Foco em Infraestrutura:** O Dashboard do Coordenador deve exibir métricas de "Saúde do Sistema": Total de Pastas criadas (adoção) e Uso de Disco (custo/limite do Drive).
3. **Role-Based Views:** O Backend entrega objetos de estatísticas diferentes (`global` vs `pessoal`) dependendo da role, ao invés do Frontend filtrar dados sensíveis.

## [15/02/2026] Correção de Estatísticas e Painel Geral
**Problema:**
O painel do coordenador e a lista do professor exibiam "0 arquivos" mesmo em pastas cheias.
**Causa:**
A subquery SQL comparava `documents.folder_id` (que é o ID numérico do banco) com `submission_folders.drive_folder_id` (que é a string hash do Google).
**Solução:**
Ajustada a query no `SubmissionFolderRepository` para comparar `documents.folder_id = submission_folders.id`.

**Decisão de Arquitetura:**
Optou-se por criar um método `findAllWithDetails` no Repositório que utiliza `JOIN` com a tabela `users` para entregar o nome do professor diretamente na listagem, evitando múltiplas requisições no Frontend ("N+1 problem").

## [15/02/2026] Política de Exclusão de Entregas
**Contexto:**
O Coordenador precisa de ferramentas para limpar o sistema, mas a instituição deve obedecer à legislação de guarda de documentos acadêmicos pelo periodo que o aluno tem para terminar os cursos de 5 anos.

**Decisão:**
Implementado um "Soft Block" no Backend:
- O sistema calcula a idade da pasta (`Date.now() - created_at`).
- Se `< 5 anos` e contiver arquivos: **Bloqueia** e retorna erro informativo.
- Se `< 5 anos` e estiver vazia: **Permite** (entende-se como erro de criação).
- Se `> 5 anos`: **Permite** (expirou o prazo legal).

## [17/02/2026] Acessibilidade Global (UserWay)
**Contexto:**
O sistema SGPI precisa atender a requisitos de inclusão digital (contraste, leitura de tela, aumento de fonte), garantindo acesso a usuários com deficiência visual ou motora.

**Decisão:**
Optou-se pela integração do widget **UserWay** (Versão Gratuita) via CDN global.

**Justificativa Técnica:**
1.  **Performance:** A injeção direta no `index.html` garante que a ferramenta de acessibilidade carregue independentemente da renderização do React (Single Page Application).
2.  **Cobertura:** O widget flutua sobre todas as rotas do sistema sem necessidade de configuração por página.
3.  **Configuração (Workaround):** Devido às limitações do painel gratuito da UserWay, a posição do widget foi forçada via código usando a variável global `_userway_config` no `head` do HTML, fixando-o na parte inferior da tela para não obstruir a navegação.

## [17/02/2026] Avisos Dinâmicos no Dashboard
**Contexto:**
O dashboard possuía um aviso estático ("Verifique o calendário..."). O Coordenador necessitava de um canal direto para comunicar prazos, manutenções ou alertas urgentes aos professores sem depender de deploy.

**Decisão:**
Implementado um sistema de **Avisos Dinâmicos (Database-Driven)**.
- O aviso é lido de uma tabela SQL a cada carregamento do Dashboard.
- O Coordenador possui permissão de escrita via Modal no próprio Dashboard.
- Utiliza-se tipos semânticos (`info`, `warning`, `error`) para alterar a cor do alerta visualmente (UX).