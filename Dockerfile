# Multi-stage build para otimização
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++ && ln -sf python3 /usr/bin/python

WORKDIR /app

# Copiar arquivos de dependências
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Stage para backend
FROM base AS backend-deps
WORKDIR /app/backend
RUN npm ci --only=production && npm cache clean --force

# Stage para frontend build
FROM base AS frontend-build
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage para backend build
FROM base AS backend-build
WORKDIR /app/backend
RUN npm ci
COPY backend/ .
RUN npm run build

# Stage final - apenas produção
FROM node:18-alpine AS production

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

WORKDIR /app

# Copiar dependências de produção do backend
COPY --from=backend-deps --chown=appuser:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-build --chown=appuser:nodejs /app/backend/dist ./dist
COPY --from=backend-build --chown=appuser:nodejs /app/backend/package*.json ./

# Copiar build do frontend
COPY --from=frontend-build --chown=appuser:nodejs /app/frontend/dist ./public

# Copiar scripts e arquivos necessários
COPY --chown=appuser:nodejs backend/python ./python

# Criar diretórios necessários
RUN mkdir -p /app/logs /app/backups /app/uploads && \
    chown -R appuser:nodejs /app/logs /app/backups /app/uploads

# Definir usuário
USER appuser

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http=require('http');const req=http.request({hostname:'localhost',port:process.env.PORT||3000,path:'/health',timeout:2000},res=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.end();"

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["node", "dist/app.js"]