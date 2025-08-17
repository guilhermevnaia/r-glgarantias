# 🚀 COMO FAZER DEPLOY - PASSO A PASSO SIMPLES

**Para quem nunca fez deploy antes - 15 minutos para ter tudo online!**

## 🎯 RESULTADO FINAL
Você terá:
- ✅ Site funcionando: `https://seusite.vercel.app` 
- ✅ Totalmente grátis
- ✅ HTTPS automático
- ✅ Atualizações automáticas

---

## 📝 PASSO 1: Criar conta no GitHub

1. Vá em **github.com**
2. Clique "Sign up" 
3. Escolha um nome de usuário
4. Confirme email

---

## 📤 PASSO 2: Subir código para GitHub

### Opção A: Interface Web (Mais Fácil)
1. No GitHub, clique "New repository"
2. Nome: `gl-garantias`
3. Clique "Create repository"
4. Clique "uploading an existing file"
5. Arraste TODA a pasta `r-glgarantias` para lá
6. Escreva: "Primeiro commit"
7. Clique "Commit changes"

### Opção B: Terminal (Se souber usar)
```bash
cd "S:\comp-glgarantias\r-glgarantias"
git init
git add .
git commit -m "Deploy inicial"
git remote add origin https://github.com/SEUUSUARIO/gl-garantias.git
git push -u origin main
```

---

## 🚀 PASSO 3: Deploy do Backend (Railway)

### 3.1 Criar conta
1. Vá em **railway.app**
2. Clique "Login with GitHub"
3. Autorize Railway

### 3.2 Fazer deploy
1. Clique "New Project"
2. "Deploy from GitHub repo"
3. Selecione `gl-garantias`
4. Aguarde build (2-3 minutos)

### 3.3 Configurar variáveis
1. No projeto Railway, clique "Variables"
2. Adicione estas variáveis uma por uma:

```
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://njdmpdpglpidamparwtr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZG1wZHBnbHBpZGFtcGFyd3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMDQ4MTE5MywiZXhwIjoyMDM2MDU3MTkzfQ.R4Kn6Cl0RPeHbF0fhGNV7Y8FjAGQEK7c8WJnDshg5yg
JWT_SECRET=sua_chave_super_secreta_aqui_minimo_32_caracteres
```

### 3.4 Gerar JWT_SECRET
No terminal execute:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copie o resultado para JWT_SECRET

### 3.5 Pegar URL do backend
- Após deploy, copie a URL: `https://seubackend.railway.app`

---

## 🌐 PASSO 4: Deploy do Frontend (Vercel)

### 4.1 Criar conta
1. Vá em **vercel.com**
2. Clique "Continue with GitHub"
3. Autorize Vercel

### 4.2 Fazer deploy
1. Clique "New Project"
2. Selecione `gl-garantias`
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Clique "Deploy"

### 4.3 Configurar variável
1. Vá em Settings > Environment Variables
2. Adicione:
```
VITE_API_URL=https://seubackend.railway.app
```
(Use a URL do Railway do passo 3.5)

### 4.4 Fazer novo deploy
1. Vá em Deployments
2. Clique nos 3 pontinhos do último deploy
3. "Redeploy"

---

## ✅ PASSO 5: Testar se funcionou

### 5.1 Testar backend
- Acesse: `https://seubackend.railway.app/health`
- Deve aparecer: `{"status":"healthy"}`

### 5.2 Testar frontend
- Acesse: `https://seufrontend.vercel.app`
- Faça login: `admin@glgarantias.com` / `Admin123!@#`
- Teste fazer upload de uma planilha Excel

---

## 🚨 SE DER ERRO

### Erro "Cannot connect to database"
- Verifique se as variáveis no Railway estão corretas
- Especialmente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`

### Erro "CORS policy"
1. No Railway, adicione variável:
```
CORS_ORIGINS=https://seufrontend.vercel.app
```

### Frontend não carrega dados
1. No Vercel, verifique se `VITE_API_URL` está correto
2. Deve ser a URL do Railway

### Build falha
- Aguarde 5 minutos e tente novamente
- Plataformas gratuitas às vezes demoram

---

## 🎉 PRONTO!

**Seu sistema está online!**

### URLs que você terá:
- **Frontend**: `https://seufrontend.vercel.app`
- **Backend**: `https://seubackend.railway.app`

### Para acessar:
- **Login**: `admin@glgarantias.com`
- **Senha**: `Admin123!@#`

### Custos:
- **Railway**: Grátis por 500 horas/mês (suficiente)
- **Vercel**: Totalmente grátis
- **Supabase**: Grátis até 500MB

### Atualizações:
- Qualquer mudança no GitHub → Deploy automático
- Não precisa fazer nada manual

**🚀 PARABÉNS! Você fez seu primeiro deploy!**