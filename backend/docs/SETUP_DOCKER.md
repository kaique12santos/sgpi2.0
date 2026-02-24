
## 🐳 Como Rodar o Projeto com Docker (Recomendado)

O projeto foi containerizado para garantir consistência entre ambientes de desenvolvimento e produção.

---

### 📋 Pré-requisitos

- Docker Desktop instalado e em execução  
- Git para clonar o repositório  

---

### 🚀 Passo a Passo

#### 1️⃣ Configure as Variáveis de Ambiente

Certifique-se de que o arquivo `backend/.env` está configurado com:

```env
DB_HOST=db
DB_PASSWORD=root
````

> `DB_HOST=db` é o nome do serviço do banco definido no `docker-compose`.

---

#### 2️⃣ Inicie o Ambiente

Na raiz do projeto, execute:

```bash
docker-compose up --build
```

Esse comando irá:

* Baixar as imagens necessárias
* Criar o container do banco de dados
* Executar scripts de criação e seed
* Iniciar os servidores backend e frontend

---

#### 3️⃣ Acesse a Aplicação

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend (API):** [http://localhost:3000](http://localhost:3000)
* **Banco de Dados (Externo):**

  * Host: `localhost`
  * Porta: `3307`
  * Usuário: `root`
  * Senha: `root`

---

## 🛠️ Comandos Úteis

### ⛔ Parar a aplicação

Pressione:

```bash
Ctrl + C
```

---

### 🔄 Reiniciar um serviço específico

```bash
docker-compose restart backend
```

---

### ♻️ Resetar o Banco de Dados (Apagar tudo e recriar)

```bash
docker-compose down -v
docker-compose up --build
```

⚠️ **Atenção:**
Esse comando remove todos os volumes, apaga os dados do banco e executa novamente os scripts de seed.

```
```
