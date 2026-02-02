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