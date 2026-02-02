````md
# Documentação da API REST – SGPI 2.0

## 🔐 Autenticação

### 1. Registrar Usuário

Cria um novo acesso ao sistema (Professor ou Coordenador).

- **Rota:** `POST /api/auth/register`
- **Descrição:** Registra um novo usuário com perfil autorizado.

#### Body (JSON)
```json
{
  "name": "Nome Completo",
  "email": "email@fatec.sp.gov.br",
  "password": "senha_segura",
  "role": "professor"
}
````

> 🔎 O campo `role` pode ser:
>
> * `professor`
> * `coordenador`

#### Retorno (201)

```json
{
  "success": true,
  "userId": 1
}
```

---

### 2. Login

Autentica o usuário e retorna o token de acesso (JWT).

* **Rota:** `POST /api/auth/login`
* **Descrição:** Realiza autenticação e gera token para acesso às rotas protegidas.

#### Body (JSON)

```json
{
  "email": "email@fatec.sp.gov.br",
  "password": "senha_segura"
}
```

#### Retorno (200)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 1,
    "name": "Nome Completo",
    "role": "professor"
  }
}
```
## Gestão de Pastas (Pacotes)

### 1. Criar Pacote de Entrega
Cria a estrutura de pastas no Drive e vincula ao usuário.
- **Rota:** `POST /api/folders/create`
- **Auth:** Necessário Bearer Token.
- **Body:**
  ```json
  {
    "title": "Avaliação P1 - Projetos",
    "disciplineId": 2
  }

#### Retorno (201)
```json
{
  "success": true,
  "folder": {
    "id": 15,
    "title": "Avaliação P1 - Projetos",
    "driveLink": "https://drive.google.com/..."
  }
}
```

#### 2. Listar Meus Pacotes
Retorna todos os pacotes de documentos criados pelo professor logado.

Rota: GET /api/folders/my-folders

Autenticação: Bearer Token (JWT obrigatório)

### 3. Upload de Arquivos
Envia arquivos para a fila de processamento.
- **Rota:** `POST /api/uploads`
- **Auth:** Necessário Bearer Token.
- **Content-Type:** `multipart/form-data`
- **Campos:**
  - `folderId`: ID do pacote de entrega (Submission Folder).
  - `files`: Array de arquivos (Máx 10 por vez, 50MB cada).
- **Retorno (201):**
  ```json
  {
    "success": true,
    "message": "2 arquivos colocados na fila de upload.",
    "documents": [
      { "id": 45, "name": "diagrama.pdf", "status": "PENDING" }
    ]
  }

### 4. Download de Pacotes
Gera e baixa um arquivo ZIP contendo todos os documentos aprovados de uma pasta.
- **Rota:** `GET /api/downloads/folder/:folderId`
- **Auth:** Necessário Bearer Token.
- **Retorno:** Arquivo binário (`application/zip`).
- **Nome do Arquivo:** `Titulo_do_Pacote.zip`

### 5. Gestão e Limpeza
Rotas para manutenção do conteúdo.

#### 6. Deletar Documento
Remove um arquivo do banco e move para a lixeira do Drive.
- **Rota:** `DELETE /api/management/documents/:id`
- **Auth:** Necessário Bearer Token.
- **Retorno (200):** `{ "success": true, "message": "..." }`

### 7. Autenticação
...
- **POST /api/auth/register**
  - Agora envia e-mail com token. Retorna aviso se o e-mail falhar.
- **POST /api/auth/verify** (NOVO)
  - **Body:** `{ "email": "...", "code": "123456" }`
  - **Retorno:** Sucesso ou Erro.
- **POST /api/auth/login**
  - **Mudança:** Retorna `403 Forbidden` se a conta não estiver verificada.

### 8. Dados Auxiliares (Metadados)
Endpoints para popular selects e informações do sistema.
- **GET /api/metadata/disciplines**
  - Lista todas disciplinas (ID, Nome).
- **GET /api/metadata/semester**
  - Retorna o semestre ativo (ex: 2025_1).

### Recuperação e Segurança
- **POST /api/auth/resend-verification**
  - Reenvia o código de 6 dígitos para o e-mail cadastrado.
- **POST /api/auth/forgot-password**
  - Gera um token de reset e envia por e-mail (Validade: 1h).
- **POST /api/auth/reset-password**
  - **Body:** `{ "email": "...", "code": "...", "newPassword": "..." }`
  - Define a nova senha e limpa os tokens de segurança.

  ### Gestão de Pastas
- **DELETE /api/management/folders/:id**
  - **Auth:** Exclusivo para Coordenador.
  - **Lógica:**
    1. Verifica a data de criação.
    2. Se idade < 5 anos e contiver arquivos -> Retorna `400 Bad Request` (Bloqueado).
    3. Se idade >= 5 anos OU estiver vazia -> Remove do Banco e do Drive.
  - **Retorno:** Sucesso ou Erro com justificativa legal.