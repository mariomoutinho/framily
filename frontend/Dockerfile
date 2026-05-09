FROM node:20-alpine

RUN apk add --no-cache libc6-compat bash

WORKDIR /app

# Dependências instaladas no entrypoint para suportar dev hot-reload com volume montado
COPY package*.json ./

EXPOSE 3000

CMD ["sh", "-c", "if [ ! -d node_modules ] || [ ! \"$(ls -A node_modules 2>/dev/null)\" ]; then npm install; fi && npm run dev -- --hostname 0.0.0.0"]
