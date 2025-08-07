# 🚨 CONFIGURAÇÃO URGENTE DO SUPABASE

## Problema Identificado:
- Backend não consegue conectar ao Supabase
- Falta `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env`

## Solução Imediata:

### 1. Acesse seu projeto Supabase:
```
https://app.supabase.com/project/YOUR_PROJECT/settings/api
```

### 2. Copie essas informações:
- **URL do Projeto**: `https://your-project.supabase.co`
- **anon/public key**: `eyJhbG...`
- **service_role key**: `eyJhbG...` (ESTA É A IMPORTANTE!)

### 3. Edite o arquivo `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Depois execute:
```bash
cd backend
npm start
```

```bash
cd frontend  
npx vite --port 3000
```

## ⚠️ ATENÇÃO:
- Sem o `SUPABASE_SERVICE_ROLE_KEY` o sistema não funciona
- É a chave que permite acesso total ao banco
- Procure por "service_role" nas configurações do Supabase