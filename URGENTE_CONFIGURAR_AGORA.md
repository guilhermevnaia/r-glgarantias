# 🚨 CONFIGURAÇÃO URGENTE - SISTEMA QUASE PRONTO!

## ✅ STATUS ATUAL:
- ✅ Backend rodando na porta 3005
- ✅ Frontend rodando na porta 3000  
- ✅ URL corrigida no frontend
- ❌ **FALTA APENAS**: Chave do Supabase

## 🔧 SOLUÇÃO RÁPIDA (2 MINUTOS):

### 1. Acesse: https://app.supabase.com
### 2. Faça login no seu projeto
### 3. Vá em Settings → API
### 4. Copie a **service_role key** (não a anon key!)

### 5. Abra o arquivo: `backend\.env`
### 6. Substitua esta linha:
```
# Atual (não funciona):
SUPABASE_URL=https://your-project.supabase.co

# Coloque SUA URL real:
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE_AQUI
```

### 7. Reinicie o backend:
- Feche o terminal do backend
- Abra novo terminal:
```bash
cd "S:\comp-glgarantias\r-glgarantias\backend"
npm start
```

## 🔑 CREDENCIAIS DE LOGIN:
- **Email**: admin@glgarantias.com
- **Senha**: Admin123

## 🌐 ACESSAR O SISTEMA:
http://localhost:3000

---
**Assim que configurar o Supabase, o sistema funcionará 100%!**