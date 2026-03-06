# Estágio de dependências
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Estágio de compilação
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o client do Prisma
RUN npx prisma generate

# Pula a verificação de lint no build para ser mais rápido
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Estágio de execução
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Script para rodar migrations antes de iniciar a aplicação
CMD npx prisma@6.4.1 migrate deploy && node server.js
