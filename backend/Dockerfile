# backend/Dockerfile

# Usa uma imagem leve do Node
FROM node:18-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências primeiro (para aproveitar cache)
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta que o servidor usa
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["npm", "start"]