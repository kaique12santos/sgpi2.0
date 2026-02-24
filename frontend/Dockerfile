# frontend/Dockerfile

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expõe a porta do Vite (padrão 5173)
EXPOSE 5173

# O --host é essencial para o Vite aceitar conexões fora do container
CMD ["npm", "run", "dev", "--", "--host"]