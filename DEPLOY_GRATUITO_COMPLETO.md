# 🚀 GUIA COMPLETO DE DEPLOY GRATUITO - GL Garantias

## 🎯 OBJETIVO: Deploy 100% Gratuito Amanhã

Este guia te levará do zero ao sistema funcionando em produção **sem pagar um centavo**.

---

## 🆓 PLATAFORMAS GRATUITAS QUE USAREMOS

### **Frontend (Vercel)**
- ✅ **Unlimited static sites**
- ✅ **100GB bandwidth/mês**
- ✅ **CDN global automático**
- ✅ **SSL/HTTPS automático**
- ✅ **Custom domains**

### **Backend (Railway/Render)**
- ✅ **500h/mês Railway** (suficiente para sempre online)
- ✅ **750h/mês Render** (backup option)
- ✅ **512MB RAM garantidos**
- ✅ **Auto-deploy do GitHub**

### **Banco de Dados (Supabase)**
- ✅ **Já configurado e funcionando**
- ✅ **500MB storage grátis**
- ✅ **50k requests/mês**

### **Cache Redis (Upstash)**
- ✅ **10k requests/dia grátis**
- ✅ **Integração automática**

---

## 📋 PRÉ-REQUISITOS

1. **Conta GitHub** (para versionamento)
2. **Conta Vercel** (para frontend)
3. **Conta Railway** ou **Render** (para backend)
4. **Conta Upstash** (para Redis - opcional)

---

## 🚀 PASSO A PASSO COMPLETO

### **ETAPA 1: Preparar Repositório GitHub**

```bash
# 1. Inicializar Git (se ainda não foi feito)
cd S:\comp-glgarantias\r-glgarantias
git init
git add .
git commit -m "feat: Sistema GL Garantias pronto para deploy"

# 2. Criar repositório no GitHub
# - Acesse github.com
# - Clique em "New repository"
# - Nome: "gl-garantias"
# - Público ou Privado (sua escolha)

# 3. Conectar ao GitHub
git remote add origin https://github.com/SEU_USUARIO/gl-garantias.git
git branch -M main
git push -u origin main
```

### **ETAPA 2: Deploy do Backend (Railway)**

#### **2.1. Criar Conta Railway**
1. Acesse **railway.app**
2. Faça login com GitHub
3. Autorize acesso aos repositórios

#### **2.2. Deploy Automático**
1. Clique **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha **"gl-garantias"**
4. Railway detectará automaticamente os arquivos

#### **2.3. Configurar Variáveis de Ambiente**
No painel Railway, vá em **Settings > Variables**:

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://njdmpdpglpidamparwtr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
SUPABASE_ANON_KEY=sua_anon_key_aqui
JWT_SECRET=seu_jwt_secret_super_forte_aqui
FRONTEND_URL=https://seu-frontend.vercel.app
PRODUCTION_URL=https://seu-backend.railway.app
```

#### **2.4. Obter URL do Backend**
Após deploy, copie a URL do backend:
```
https://gl-garantias-production.up.railway.app
```

### **ETAPA 3: Deploy do Frontend (Vercel)**

#### **3.1. Criar Conta Vercel**
1. Acesse **vercel.com**
2. Faça login com GitHub
3. Autorize acesso aos repositórios

#### **3.2. Deploy Automático**
1. Clique **"New Project"**
2. Selecione **"gl-garantias"**
3. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build:production`
   - **Output Directory**: `dist`

#### **3.3. Configurar Variáveis de Ambiente**
No painel Vercel, vá em **Settings > Environment Variables**:

```env
VITE_API_URL=https://gl-garantias-production.up.railway.app
NODE_ENV=production
```

#### **3.4. Obter URL do Frontend**
Após deploy, você terá:
```
https://gl-garantias.vercel.app
```

### **ETAPA 4: Configurar Redis (Upstash) - Opcional**

#### **4.1. Criar Conta Upstash**
1. Acesse **upstash.com**
2. Faça login com GitHub
3. Clique **"Create Database"**

#### **4.2. Configurar Redis**
1. **Name**: gl-garantias-cache
2. **Type**: Regional
3. **Region**: US-East-1
4. Clique **"Create"**

#### **4.3. Adicionar URL no Railway**
Copie a **Redis URL** e adicione no Railway:
```env
REDIS_URL=redis://default:sua_password@sua-url.upstash.io:porta
```

### **ETAPA 5: Configurar CORS e URLs**

#### **5.1. Atualizar URLs no Backend**
Edite `backend/src/middleware/securityMiddleware.ts`:

```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'https://gl-garantias.vercel.app', // SUA URL DO VERCEL
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_URL
];
```

#### **5.2. Commit e Push**
```bash
git add .
git commit -m "fix: Configurar URLs de produção"
git push origin main
```

**✅ Railway fará re-deploy automaticamente!**

---

## 🧪 TESTAR O SISTEMA

### **1. Verificar Backend**
```bash
curl https://sua-url.railway.app/health
# Deve retornar: {"status":"healthy"}
```

### **2. Verificar Frontend**
- Acesse: `https://sua-url.vercel.app`
- Faça login: `admin@test.com` / `admin123`
- Teste upload de planilha
- Verifique classificações de IA

### **3. Verificar Integração**
- Dashboard deve carregar dados
- Relatórios devem funcionar
- Filtros devem responder

---

## 🔧 TROUBLESHOOTING

### **Problema: Backend não conecta com Supabase**
```bash
# Verifique as variáveis no Railway
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### **Problema: CORS Error**
- Adicione a URL do Vercel nas origens permitidas
- Verifique `FRONTEND_URL` no Railway

### **Problema: Frontend não conecta com Backend**
- Verifique `VITE_API_URL` no Vercel
- Teste URL do backend no navegador

### **Problema: Build Falha**
```bash
# No Railway, verifique logs:
railway logs

# No Vercel, verifique painel de build
```

---

## 📊 MONITORAMENTO GRATUITO

### **Railway Dashboard**
- CPU, Memory, Network usage
- Logs em tempo real
- Metrics automáticos

### **Vercel Analytics**
- Page views, performance
- Error tracking
- Deploy previews

### **Upstash Console**
- Redis metrics
- Cache hit/miss rates
- Connection monitoring

---

## 💰 CUSTOS E LIMITES

### **Limites Gratuitos:**
- **Railway**: 500h/mês (sempre online)
- **Vercel**: 100GB bandwidth
- **Supabase**: 500MB + 50k requests
- **Upstash**: 10k requests/dia

### **Se Exceder (opções):**
1. **Railway → Render**: Mover backend (750h grátis)
2. **Vercel → Netlify**: Mover frontend (100GB grátis)
3. **Otimizar**: Cache mais agressivo

---

## 🔄 CI/CD AUTOMÁTICO

### **Auto-Deploy Configurado:**
1. **Push to main** → Railway re-deploy automático
2. **Push to main** → Vercel re-deploy automático
3. **Pull Requests** → Vercel preview deployments

### **Pipeline:**
```
GitHub Push → Build → Test → Deploy → Health Check
```

---

## 🛡️ SEGURANÇA EM PRODUÇÃO

### **Já Implementado:**
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Headers de segurança
- ✅ Input sanitization
- ✅ HTTPS automático
- ✅ Environment variables seguras

### **Monitoramento:**
- ✅ Logs estruturados
- ✅ Health checks
- ✅ Error tracking
- ✅ Performance monitoring

---

## 📞 SUPORTE E BACKUP

### **URLs Importantes:**
- **Frontend**: https://gl-garantias.vercel.app
- **Backend**: https://gl-garantias-production.up.railway.app
- **Admin**: https://railway.app/dashboard
- **Logs**: Railway Dashboard > Deployments

### **Backup Automático:**
- ✅ Backup diário às 2h AM
- ✅ Retenção de 30 dias
- ✅ Download manual disponível

---

## 🎉 CONCLUSÃO

**Pronto! Seu sistema está 100% online e gratuito!**

### **O que você tem agora:**
- ✅ Sistema completo em produção
- ✅ HTTPS e SSL automático
- ✅ CDN global (Vercel)
- ✅ Auto-scaling (Railway)
- ✅ Backup automático
- ✅ Monitoring e logs
- ✅ Zero custos

### **URLs Finais:**
- **Acesso ao Sistema**: https://gl-garantias.vercel.app
- **API Backend**: https://gl-garantias-production.up.railway.app
- **Login**: admin@test.com / admin123

**🚀 PARABÉNS! Sistema deployado com sucesso!**