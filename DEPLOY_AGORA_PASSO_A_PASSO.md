# 🚀 DEPLOY IMEDIATO - Passo a Passo Simples

## ⏰ **15 minutos para sistema no ar!**

### 🔥 **OPÇÃO RÁPIDA - Render (Recomendado)**

#### Passo 1: Deploy Backend (5 minutos)
1. **Acesse**: https://render.com
2. **Login**: Use GitHub 
3. **New** → **Web Service**
4. **Connect Repository**: `r-glgarantias`
5. **Configure**:
   ```
   Name: gl-garantias-backend
   Environment: Node
   Region: Ohio (US East)
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

6. **Environment Variables** (clique em Advanced):
   ```bash
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=https://njdmpdpglpidamparwtr.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZG1wZHBnbHBpZGFtcGFyd3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzc3MDE4NywiZXhwIjoyMDM5MzQ2MTg3fQ.gNjKAfUgJ5fmkfnP13OHBmzGXOgOD1njRs8kF2KhGV0
   JWT_SECRET=gl-garantias-jwt-super-secret-2025
   CORS_ORIGIN=*
   ```

7. **Deploy** → Aguarde 5 minutos

#### Passo 2: Deploy Frontend (3 minutos)
1. **Acesse**: https://vercel.com
2. **Login**: Use GitHub
3. **New Project** → `r-glgarantias`
4. **Configure**:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

5. **Environment Variables**:
   ```bash
   VITE_API_URL=https://[seu-backend-render].onrender.com
   ```
   ⚠️ **Substitua** `[seu-backend-render]` pela URL que apareceu no Render

6. **Deploy** → Aguarde 3 minutos

#### Passo 3: Configurar CORS (2 minutos)
1. **Volte no Render** → Seu serviço backend
2. **Environment** → Edite `CORS_ORIGIN`
3. **Coloque** a URL do Vercel: `https://[seu-frontend].vercel.app`
4. **Save Changes**

---

### 🔥 **OPÇÃO ALTERNATIVA - Netlify**

#### Deploy Frontend (Netlify)
1. **Acesse**: https://netlify.com
2. **Add new site** → **Import from Git**
3. **GitHub** → `r-glgarantias`
4. **Configure**:
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

5. **Environment variables**:
   ```bash
   VITE_API_URL=https://[seu-backend].onrender.com
   ```

---

## ✅ **Teste Final (2 minutos)**

### 1. Acesse seu frontend
- URL: `https://[nome].vercel.app` ou `https://[nome].netlify.app`

### 2. Teste Login
- Usuário: `admin@glgarantias.com`
- Senha: `admin123`

### 3. Teste Upload
- Use o arquivo `GLú-Garantias.xlsx`
- Vá em "Upload Excel"
- Faça upload e aguarde processamento

### 4. Verifique Dashboard
- Veja se os dados aparecem
- Teste navegação entre abas

---

## 🔧 **Se algo der errado:**

### Backend não funciona:
1. **Render** → Seu serviço → **Logs**
2. Procure por erros de environment variables
3. Verifique se SUPABASE_URL está correto

### Frontend não conecta:
1. **F12** → **Console** → Veja erros CORS
2. Verifique se VITE_API_URL está correto no Vercel
3. Verifique se CORS_ORIGIN está correto no Render

### Upload falha:
1. Arquivo deve ter máximo 100MB
2. Deve ter aba "Tabela"
3. Veja logs do backend no Render

---

## 🎯 **URLs Finais**

Após completar:

✅ **Backend**: `https://[nome].onrender.com`  
✅ **Frontend**: `https://[nome].vercel.app`  
✅ **Database**: Supabase (já configurado)

---

## 💡 **Dicas Pro:**

1. **Render pode hibernar** após 15min sem uso (plano gratuito)
2. **Primeiro acesso** pode demorar 30s (cold start)
3. **Vercel é instantâneo** sempre
4. **Dados ficam salvos** no Supabase

---

**🚀 PRONTO! Sistema no ar em 15 minutos!**