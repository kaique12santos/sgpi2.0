# Arquitetura Frontend - SGPI 2.0

## 1. Stack Tecnológico
- **Core:** React 18 + Vite.
- **UI Framework:** Mantine v7 (Substituindo Tailwind/CSS Puro para agilidade e padronização).
- **Ícones:** @tabler/icons-react.
- **HTTP Client:** Axios (Configurado em `src/api/axios.js`).
- **Rotas:** React Router Dom v6.

## 2. Identidade Visual (Tema)
O tema foi configurado em `src/theme/index.js` para espelhar a identidade visual do SGPI original (Legacy).
- **Primary Color:** `fatecRed` (Customizada).
- **Paleta de Cores:**
  - `fatecRed`: Baseada no tom `#970000` (Header) e `#6f0000` (Botões).
  - `fatecBlue`: Baseada no tom `#0066cc` (Links).
- **Tipografia:** Roboto (Google Fonts) com fallback para Lucida Sans.
- **Global:** Background suave `#f8f9fa` para conforto visual (configurado em `index.css`).

## 3. Estrutura de Pastas (Domínio)
- `src/api/`: Instância do Axios com Interceptors para Token JWT.
- `src/components/`: Componentes visuais isolados.
- `src/context/`: Gerenciamento de estado global (Auth).
- `src/layout/`: Estruturas de página (Sidebar, Header).
- `src/pages/`: Telas da aplicação.
- `src/theme/`: Configurações de design system.

## 4. Evolução da Identidade Visual (V1)
**Data:** 02/02/2026
**Estilo:** "Institucional Clean"
- **Login:** Adotado o padrão de "Card Bicolor" (Cabeçalho Vermelho `#970000` com logo SGPI + Corpo Branco).
- **Layout Principal:**
  - **Header:** Barra sólida vinho (`#970000`) contendo logos institucionais (CPS à esquerda, Fatec à direita).
  - **Sidebar:** Menu vertical claro com indicação de ativo via borda esquerda vermelha (Padrão Dashboard Aluno).
- **Fluxo de Cadastro:** Implementado em etapas (Stepper) para separar dados pessoais da validação de token.

**Data:** 09/02/2026

### 5. Acessibilidade (A11y) no Select de Disciplinas
- **Problema:** Usuários com idade variada (25 a 68 anos) tinham dificuldade de identificar o semestre correto apenas pelo texto.
- **Solução:** Implementação de "Avatar Numérico" com cores semânticas de alto contraste (Badge Sólida).
  - *Cores:* Azul (Início) -> Laranja/Vermelho (Final do curso).
  - *Benefício:* Identificação cognitiva rápida por cor e número grande.

### 6. Prevenção de Erros (Poka-Yoke)
- **Modal de Cerimônia:** O botão "Enviar" não faz o upload direto. Ele abre um modal de confirmação que exibe:
  - Nome da Disciplina (com a cor correspondente).
  - Quantidade de arquivos.
  - Título da pasta.
  - *Objetivo:* Forçar uma pausa de leitura para evitar envios na disciplina errada.

### 7. Tratamento de Links Externos
- **Problema:** O Backend processa filas de arquivos físicos. Links de YouTube/GitHub quebravam esse padrão.
- **Solução (`addLinkAsFile`):** O Frontend intercepta o link e gera um arquivo `.html` em memória (Blob) contendo um redirecionamento automático.
  - O Backend recebe como se fosse um arquivo comum, mantendo a arquitetura de "Pacote" inalterada.

### 8. Dropzone Permissiva
- Expandido `accept` para incluir PPTX, Vídeos (MP4/WebM) e variações de ZIP/RAR, cobrindo todos os cenários de entrega docente.


### 9. Módulo de Upload e Validação
## [2026-02-10]
**Componentes:** `UploadPage.jsx` e Modal de Edição em `MyFoldersPage.jsx`.

**Regras de Negócio Implementadas:**
1. **Validação "Porteiro":** O evento `onDrop` intercepta os arquivos. Utiliza Regex `/^[a-zA-Z0-9._-]+$/` para rejeitar arquivos com caracteres especiais e notifica o usuário via Toast (Mantine Notifications).
2. **Conversão de Links:** Inputs de texto para URL transformam a string em um `Blob` (arquivo virtual) do tipo `text/html` contendo um script de redirecionamento. Isso permite unificar a lógica de envio (tudo é arquivo).
3. **Upload Unificado:** Tanto a criação quanto a edição utilizam `FormData` e delegam o processamento pesado para o Backend.