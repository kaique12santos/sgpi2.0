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