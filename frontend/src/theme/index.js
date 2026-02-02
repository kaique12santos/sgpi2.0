import { createTheme } from '@mantine/core';

export const theme = createTheme({
  // Define nossa cor personalizada como a primária do sistema
  primaryColor: 'fatecRed',
  
  colors: {
    // Escala de vermelhos baseada no seu main.css
    fatecRed: [
      "#ffeoeo", // 0 - Muito claro (fundo suave)
      "#ffcdcd", // 1
      "#ff9b9b", // 2
      "#ff6969", // 3
      "#ff3737", // 4
      "#ff0505", // 5
      "#970000", // 6 - SEU VERMELHO PRINCIPAL (Header)
      "#820000", // 7
      "#6f0000", // 8 - SEU VERMELHO ESCURO (Botões)
      "#390005", // 9 - SEU HOVER (Quase preto)
    ],
    // Mantemos um azul padrão caso precise
    fatecBlue: [
      "#e6f7ff", // 0 - Seu azul clarinho de notificação
      "#d0ebff", "#a5d8ff", "#74c0ff", "#4dabff", 
      "#339af0", 
      "#0066cc", // 6 - SEU AZUL DE LINKS
      "#1c7ed6", "#1971c2", "#1864ab"
    ]
  },

  // Fonte similar à do seu CSS original, mas modernizada
  fontFamily: 'Roboto, "Lucida Sans", "Lucida Sans Regular", sans-serif',
  
  // Estilos globais para componentes (opcional, para forçar cantos arredondados iguais ao seu CSS)
  components: {
    Button: {
      defaultProps: {
        radius: 'md', // Bordas levemente arredondadas
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
      }
    }
  }
});