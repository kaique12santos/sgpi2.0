# Arquitetura do Sistema - SGPI 2.0 (GED)

## Visão Geral
O sistema segue o padrão MVC (Model-View-Controller) adaptado para API REST, com uma camada adicional de Services e Repositories para isolar a regra de negócio do acesso a dados e da interface HTTP.

## Diagrama de Camadas
`Client (Frontend)` -> `Route` -> `Controller` -> `Service` -> `Repository` -> `Database`

## Responsabilidades dos Componentes

### 1. Config (src/config)
Responsável por configurações globais e Singletons.
- **Database.js:** Gerencia o Pool de conexões MySQL (Padrão Singleton).

### 2. Models (src/models)
Representação das entidades do sistema, mas sem lógica de persistência. Apenas estrutura de dados.

### 3. Repositories (src/repositories)
Camada de acesso a dados. **NENHUMA** regra de negócio deve estar aqui.
- Executa queries SQL puras.
- Retorna objetos ou arrays de dados brutos.

### 4. Services (src/services)
Coração da aplicação.
- Contém a lógica de "Como fazer".
- Chama Repositories para buscar/salvar dados.
- Chama APIs externas (Google Drive).
- Lança erros se as regras de negócio forem violadas.

### 5. Controllers (src/controllers)
Porta de entrada da API.
- Recebe `req` e `res`.
- Valida o formato dos dados de entrada.
- Chama o Service apropriado.
- Padroniza a resposta HTTP (Status Code e JSON).

### 6. Utils (src/utils)
Funções auxiliares puras (Formatadores de data, Loggers, Validadores de string).

### 7. Middlewares (src/middlewares)
Componentes interceptadores que atuam entre a **Rota** e o **Controller**.
**Responsabilidade:**
- Executar lógicas transversais que se aplicam a múltiplas rotas (ex: Segurança, Logs).
- **AuthMiddleware:**
    - Intercepta a requisição HTTP.
    - Verifica a existência e validade do Token JWT no Header `Authorization`.
    - Bloqueia requisições não autorizadas (Erro 401) antes que cheguem ao Controller.
    - Decodifica o token e injeta `req.userId` e `req.userRole` para uso posterior.

### 8. Workers (Background Jobs)
Serviços que rodam em segundo plano, desacoplados da requisição HTTP.
- **UploadQueueWorker:**
    - Monitora a tabela `documents`.
    - Processa arquivos enviados para a pasta temporária local.
    - Realiza o upload para o Google Drive.
    - Gerencia retentativas (Retry Logic) em caso de falha de rede.
    - Limpa o disco local após sucesso.

### 9. Automation Services
Serviços temporizados que rodam independentemente de requisições do usuário.
- **CleanupService:** Garbage collector do disco local.
- **SemesterAutomationService:** Gerente do calendário acadêmico (Rotação de pastas 2025_1 -> 2025_2).

### 10. Communication Services
- **EmailService:** Abstração do `nodemailer`. Responsável pelo envio transacional de códigos de verificação e, futuramente, notificações de prazos.


### 11. Fluxo de Processamento Assíncrono (UploadQueueWorker)
## [2026-02-10]

O sistema utiliza um padrão de Fila para uploads pesados e geração de links, evitando travar a requisição do usuário.

**Fluxo de Execução:**
1. **Entrada:** O Controller (`create` ou `addFiles`) salva o registro do arquivo no MySQL com status `PENDING` e o arquivo físico em `/uploads`.
2. **Processamento:** O `UploadQueueWorker` monitora a fila.
3. **Upload Drive:** Envia o arquivo para a pasta correta no Google Drive.
   - *Correção ZIP:* Se a API do Drive não retornar links de visualização para ZIPs, o Worker gera os links manualmente baseados no ID.
4. **Extração de Metadados:**
   - Se o arquivo for `.html` (link externo), o Worker lê o conteúdo, extrai a URL original (YouTube/GitHub) via Regex e salva no campo `external_link`.
5. **Finalização:** Atualiza o banco para `COMPLETED`, salva os IDs/Links do Drive e deleta o arquivo local.

#### 12. Atualize com o novo controlador.

## [2026-02-11] Módulo Dashboard
**Responsabilidade:** Agregar dados para visualização rápida sem processamento pesado.
**Componente:** `DashboardController`.

**Fluxo de Dados:**
1. O controlador identifica a `role` do usuário via Banco de Dados (para garantir consistência além do Token).
2. Executa queries `COUNT` e `SUM` otimizadas.
3. Não realiza cruzamento de dados complexos para manter a performance da Home alta.

### 13. Organização de Rotas Administrativas

## [2026-02-15] 
**Decisão:**
Para evitar conflitos e poluição no `app.js`, as rotas administrativas foram segregadas em arquivos específicos:
- `admin.routes.js`: Gestão de Pessoas (CRUD Usuários).
- `management.routes.js`: Gestão de Conteúdo (Delete Pastas/Arquivos).
- `download.routes.js`: Streaming de Arquivos.

Essa separação facilita a manutenção e permite aplicar middlewares de segurança (ex: `checkRole('coordenador')`) em blocos inteiros de rotas futuramente.