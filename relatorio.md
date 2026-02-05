
# 📑 Relatório de Implementação Técnica — Ciclo de Upload e Fila

**Data:** 05/02/2026  
**Módulos Afetados:** Backend (API, Controllers, Repositories), Frontend (UploadPage), Database  
**Objetivo:** Implementar fluxo de entrega de projetos com hierarquia de pastas automática (Google Drive) e processamento assíncrono via Fila (Queue).

---

## 1. Backend (API & Regras de Negócio)

### 📂 Controllers

#### `src/controllers/UploadController.js`

**Refatoração Completa**  
Deixou de ser um receiver simples de arquivos para se tornar um **orquestrador de infraestrutura**.

**Lógica _Find or Create_**  
Implementada verificação hierárquica antes do upload:

- Verifica/Cria pasta do **Semestre Ativo** (Raiz)
- Verifica/Cria pasta da **Disciplina**  
  - Evita duplicatas usando `findDriveIdByDisciplineAndSemester`
- Cria a pasta do **Pacote de Entrega** (título enviado pelo usuário)

**Integração com Worker**

- Após criar a estrutura, os arquivos são salvos no banco com status `PENDING`
- O método `UploadQueueWorker.processQueue()` é disparado

---

#### `src/controllers/SubmissionFolderController.js`

**Novo Endpoint**

- Criado método `index` para listar as pastas/disciplinas disponíveis para o Frontend

---

### 🗄️ Repositories

#### `src/repositories/DocumentRepository.js`

**Correção de Tipagem (SQL)**  
Implementada **Subquery** no `INSERT`.

- **Problema:**  
  O Frontend enviava o ID do Drive (`String`) e o banco esperava ID numérico (`folder_id`)
- **Solução:**  
  ```sql
  (SELECT id FROM submission_folders WHERE drive_folder_id = ? LIMIT 1)


**Adequação ao Schema**

* Removido o campo `title` da tabela `documents` (inexistente no DER)
* Título mantido apenas na tabela de **pastas**

---

#### `src/repositories/SubmissionFolderRepository.js`

**Robustez na Listagem**

* Método `findAll` alterado para utilizar `LEFT JOIN`
* Garante listagem de disciplinas mesmo com inconsistências em semestres antigos

**Método Auxiliar**

* Criado `findDriveIdByDisciplineAndSemester`
* Inicialmente mockado para retorno `null`
* Suporte à lógica de **não duplicar pastas de disciplinas**

---

### 🛣️ Rotas (`src/routes.js` / `uploadRoutes.js`)

**Correção de Nesting**

* Identificado conflito de prefixo entre:

  * `/api/uploads`
  * `/api/submission-folders`

**Configuração Multer**

* Middleware validado:

  ```js
  upload.array('files', 10)
  ```
* Permite upload de até **10 arquivos por requisição**

---

## 2. Frontend (React + Mantine)

### ⚛️ `src/pages/UploadPage.jsx`

**Mapeamento de IDs (Bugfix Crítico)**

* **Antes:**
  Enviava `drive_folder_id` no `value` do `Select`
  ➜ Criava pastas infinitas dentro da primeira disciplina encontrada
* **Agora:**
  Envia `discipline_id` (numérico)
  ➜ Backend localiza corretamente a disciplina no banco

**Conversão de Tipos (Mantine)**

* Aplicado:

  ```js
  String(folder.discipline_id)
  ```
* Necessário pois o componente visual rejeita valores numéricos

**Suporte a Múltiplos Arquivos**

* `Dropzone` atualizado:

  * `multiple={true}`
  * `maxFiles={10}`
* Estado `files` convertido de objeto único para **Array**
* Feedback visual adicionado:

  * Contagem de arquivos
  * Lista simples com os nomes selecionados

**Ordenação**

* Implementado `sort` com `localeCompare`
* Garante ordenação alfabética (A–Z) das disciplinas

---

## 3. Banco de Dados (Alterações Lógicas)

**Validação de Schema**

* Confirmado que a tabela `documents` **não possui coluna `title`**
* O título do trabalho pertence à tabela `submission_folders`
* Os documentos herdam apenas o campo `original_name`


