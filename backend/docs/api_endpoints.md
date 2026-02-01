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