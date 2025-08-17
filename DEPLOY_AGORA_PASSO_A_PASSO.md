# 🚀 DEPLOY IMEDIATO - Passo a Passo Simples

## ⏰ **15 minutos para sistema no ar!**

## 📸 **GUIA VISUAL - O QUE PROCURAR**

### No Render:
- **Procure**: "Add Environment Variable" (botão azul)
- **Campos**: "Key" (nome) e "Value" (valor)  
- **Localização**: Seção "Advanced" → "Environment Variables"

### No Vercel:
- **Procure**: "Environment Variables" ou "Configure Project"
- **Campos**: "Name" (nome) e "Value" (valor)
- **Localização**: Durante o setup OU depois em Settings → Environment Variables

---

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
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

6. **Environment Variables** - INSTRUÇÕES DETALHADAS:
   
   **6.1** Clique em **"Advanced"** (embaixo das configurações básicas)
   
   **6.2** Procure a seção **"Environment Variables"**
   
   **6.3** Para CADA variável abaixo, clique **"Add Environment Variable"** e preencha:

   **VARIÁVEL 1:**
   - NOME_DA_VARIÁVEL: `NODE_ENV`
   - VALOR: `production`
   - Clique **"Add"**

   **VARIÁVEL 2:**
   - NOME_DA_VARIÁVEL: `PORT`
   - VALOR: `10000`
   - Clique **"Add"**

   **VARIÁVEL 3:**
   - NOME_DA_VARIÁVEL: `SUPABASE_URL`
   - VALOR: `https://njdmpdpglpidamparwtr.supabase.co`
   - Clique **"Add"**

   **VARIÁVEL 4:**
   - NOME_DA_VARIÁVEL: `SUPABASE_SERVICE_ROLE_KEY`
   - VALOR: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZG1wZHBnbHBpZGFtcGFyd3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzc3MDE4NywiZXhwIjoyMDM5MzQ2MTg3fQ.gNjKAfUgJ5fmkfnP13OHBmzGXOgOD1njRs8kF2KhGV0`
   - Clique **"Add"**

   **VARIÁVEL 5:**
   - NOME_DA_VARIÁVEL: `JWT_SECRET`
   - VALOR: `gl-garantias-jwt-super-secret-2025`
   - Clique **"Add"**

   **VARIÁVEL 6:**
   - NOME_DA_VARIÁVEL: `CORS_ORIGIN`
   - VALOR: `*`
   - Clique **"Add"**

   **6.4** Agora você deve ter 6 variáveis listadas

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

5. **Environment Variables** - INSTRUÇÕES DETALHADAS:
   
   **5.1** Clique em **"Configure Project"** ou **"Environment Variables"**
   
   **5.2** Clique **"Add"** ou **"Add Environment Variable"**
   
   **5.3** Preencha:
   - **NOME**: `VITE_API_URL`
   - **VALOR**: `https://[seu-backend-render].onrender.com`
   
   **⚠️ IMPORTANTE**: Substitua `[seu-backend-render]` pela URL real do seu backend no Render
   
   **Exemplo**: Se sua URL do Render for `https://gl-garantias-backend.onrender.com`, então coloque:
   - **VALOR**: `https://gl-garantias-backend.onrender.com`
   
   **5.4** Clique **"Add"** para salvar

6. **Deploy** → Aguarde 3 minutos

#### Passo 3: Configurar CORS (2 minutos)

**⚠️ IMPORTANTE**: Só faça isso DEPOIS que o Vercel te der a URL final!

**3.1** Volte na aba do **Render** (seu backend)

**3.2** Na página do seu serviço, clique na aba **"Environment"** (no menu lateral esquerdo)

**3.3** Encontre a variável **"CORS_ORIGIN"** na lista

**3.4** Clique no **ícone de lápis** (editar) ao lado de CORS_ORIGIN

**3.5** Substitua o valor de `*` pela URL real do seu Vercel:
   - **Se sua URL Vercel for**: `https://r-glgarantias.vercel.app`
   - **Coloque exatamente**: `https://r-glgarantias.vercel.app`
   - **SEM barra no final!**

**3.6** Clique **"Save Changes"**

**3.7** Aguarde 30 segundos para aplicar a mudança

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