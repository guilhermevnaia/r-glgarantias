# 🚀 Deploy Gratuito Completo - Alternativo (Render + Vercel)

## ⚠️ Railway tem limitações - Usando Render + Vercel

### 📋 **Pré-requisitos**
- Conta GitHub (já criada)
- Conta Render.com (gratuita)
- Conta Vercel.com (gratuita)
- Conta Supabase.com (banco de dados gratuito)

---

## 🗄️ **Passo 1: Configurar Banco de Dados (Supabase)**

### 1.1 Criar Projeto no Supabase
1. Acesse https://supabase.com
2. Clique em "Start your project"
3. Crie uma conta ou faça login
4. Clique em "New Project"
5. Configure:
   - **Nome**: `gl-garantias-db`
   - **Organização**: Sua organização
   - **Região**: South America (São Paulo)
   - **Password**: `SuaSkha123!@#` (anote essa senha!)

### 1.2 Configurar Tabelas
1. Após criar o projeto, vá em "SQL Editor"
2. Execute o SQL do arquivo `backend/create_tables.sql`
3. Anote as credenciais:
   - **URL**: `https://[projeto].supabase.co`
   - **ANON KEY**: Na aba "API" → "anon public"
   - **SERVICE ROLE KEY**: Na aba "API" → "service_role" (⚠️ SECRETA)

---

## 🖥️ **Passo 2: Deploy Backend (Render)**

### 2.1 Preparar Render
1. Acesse https://render.com
2. Clique em "Get Started for Free"
3. Conecte sua conta GitHub
4. Clique em "New +" → "Web Service"
5. Conecte ao repositório `r-glgarantias`

### 2.2 Configurar Web Service
```
Build Command: cd backend && npm install
Start Command: cd backend && npm start
Environment: Node
Region: Ohio (US East)
```

### 2.3 Variáveis de Ambiente
Na seção "Environment Variables":

```bash
# Database
SUPABASE_URL=https://[seu-projeto].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[sua-service-role-key]

# Server
NODE_ENV=production
PORT=10000

# Segurança
JWT_SECRET=gl-garantias-jwt-super-secret-2025
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Upload
MAX_FILE_SIZE=104857600

# CORS
CORS_ORIGIN=https://[seu-frontend].vercel.app
```

### 2.4 Finalizar Deploy
1. Clique em "Create Web Service"
2. Aguarde o build (5-10 minutos)
3. Anote a URL: `https://[nome].onrender.com`

---

## 🌐 **Passo 3: Deploy Frontend (Vercel)**

### 3.1 Preparar Vercel
1. Acesse https://vercel.com
2. Clique em "Start Deploying"
3. Conecte sua conta GitHub
4. Clique em "New Project"
5. Selecione `r-glgarantias`

### 3.2 Configurar Projeto
```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 3.3 Variáveis de Ambiente
Na seção "Environment Variables":

```bash
VITE_API_URL=https://[seu-backend].onrender.com
```

### 3.4 Finalizar Deploy
1. Clique em "Deploy"
2. Aguarde o build (3-5 minutos)
3. Anote a URL: `https://[nome].vercel.app`

---

## 🔧 **Passo 4: Configurações Finais**

### 4.1 Atualizar CORS no Backend
1. Vá no Render → Seu serviço → Environment
2. Atualize `CORS_ORIGIN` com a URL do Vercel
3. Clique em "Save Changes"

### 4.2 Testar Sistema
1. Acesse a URL do Vercel
2. Teste login (use as credenciais padrão se necessário)
3. Teste upload de arquivo Excel
4. Verifique se os dados estão aparecendo

---

## 📊 **Passo 5: Upload de Dados Inicial**

### 5.1 Preparar Planilha
1. Use o arquivo `GLú-Garantias.xlsx`
2. Certifique-se de que tem a aba "Tabela"

### 5.2 Fazer Upload
1. No frontend, vá em "Upload Excel"
2. Faça upload da planilha
3. Aguarde o processamento
4. Verifique os dados no Dashboard

---

## 🔍 **Troubleshooting**

### Backend não inicia:
```bash
# Verificar logs no Render
1. Render → Seu serviço → Logs
2. Procurar por erros de environment variables
3. Verificar se SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão corretos
```

### Frontend não conecta:
```bash
# Verificar CORS
1. F12 → Console → Procurar erros CORS
2. Verificar se VITE_API_URL está correto
3. Verificar se CORS_ORIGIN no backend está correto
```

### Upload falha:
```bash
# Verificar tamanho do arquivo
1. Máximo 100MB
2. Deve ter aba "Tabela"
3. Verificar logs do backend no Render
```

---

## 💰 **Custos (Todos Gratuitos)**

| Serviço | Limite Gratuito | Suficiente? |
|---------|----------------|------------|
| **Supabase** | 500MB DB, 2GB Bandwidth | ✅ Sim |
| **Render** | 750h/mês, 512MB RAM | ✅ Sim |
| **Vercel** | 100GB Bandwidth, 100 deploys | ✅ Sim |

---

## 🔗 **URLs Finais**

Após completar o deploy, você terá:

- **Frontend**: `https://[nome].vercel.app`
- **Backend**: `https://[nome].onrender.com`
- **Database**: `https://[projeto].supabase.co`

---

## ⚡ **Próximos Passos**

1. Configurar domínio customizado (opcional)
2. Configurar SSL automático (já incluído)
3. Monitorar performance
4. Backup regular dos dados

---

**✅ Sistema 100% funcional e gratuito!**