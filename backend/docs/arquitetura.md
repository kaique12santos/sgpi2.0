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