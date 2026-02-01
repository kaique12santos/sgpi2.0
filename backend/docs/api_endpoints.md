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

