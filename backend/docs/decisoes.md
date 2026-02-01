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