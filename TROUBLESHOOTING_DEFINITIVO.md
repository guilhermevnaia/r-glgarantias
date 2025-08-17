# 🆘 TROUBLESHOOTING DEFINITIVO - GL GARANTIAS

## 🔥 PROBLEMAS MAIS COMUNS E SOLUÇÕES

### **❌ ERRO: "Failed to fetch" / "Connection Refused"**

**Sintomas:**
- Erro no console: `Failed to load resource: net::ERR_CONNECTION_REFUSED`
- Mensagem: "Erro de conexão com o servidor"
- Tela de login não consegue conectar

**Causa Raiz:** Frontend tentando conectar na porta errada (3005 ao invés de 3009)

**Solução Garantida:**
```bash
# 1. Verificar se backend está rodando na porta correta
curl http://localhost:3009/health

# 2. Se não responder, iniciar backend
cd "S:\comp-glgarantias\r-glgarantias\backend"
npm start

# 3. Verificar se todas as URLs estão corretas
node ../VERIFICACAO_AUTOMATICA_SISTEMA.js
```

**Arquivos que devem ter porta 3009:**
- ✅ `frontend/vite.config.ts` (linha 13)
- ✅ `frontend/src/services/api.ts` (linha 3)
- ✅ `frontend/src/services/authService.ts` (linha 3)
- ✅ `frontend/src/pages/Login.tsx` (linhas 32, 67, 108)
- ✅ `frontend/src/pages/Defects.tsx` (linhas 290, 322)

---

### **❌ ERRO: "Credenciais inválidas"**

**Sintomas:**
- Login falha com usuário `guilherme@gmail.com`
- Mensagem: "Credenciais inválidas" ou "Usuário não encontrado"

**Causa Raiz:** Usuário não existe no banco de dados

**Solução Garantida:**
```bash
cd "S:\comp-glgarantias\r-glgarantias\backend"
node fix_user_issues.js
```

**Verificação:**
```bash
# Testar login via API
curl -X POST "http://localhost:3009/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"guilherme@gmail.com","password":"123456"}'
```

**Resultado Esperado:** JSON com `"success":true` e token

---

### **❌ ERRO: Tela em Branco / Frontend não carrega**

**Sintomas:**
- Página http://localhost:5173 não carrega
- Erro de compilação no terminal do frontend

**Causa Raiz:** Frontend não está rodando ou tem erro de build

**Solução Garantida:**
```bash
# 1. Verificar se frontend está rodando
curl http://localhost:5173

# 2. Se não responder, iniciar frontend
cd "S:\comp-glgarantias\r-glgarantias\frontend"
npm run dev

# 3. Se houver erro de dependências
npm install --legacy-peer-deps
```

---

### **❌ ERRO: "Port already in use"**

**Sintomas:**
- `Error: listen EADDRINUSE: address already in use 0.0.0.0:3009`
- `Port 5173 is already in use`

**Causa Raiz:** Processo já está rodando na porta

**Solução Garantida:**
```bash
# Backend (porta 3009)
netstat -an | findstr :3009
# Se estiver em uso, é sinal que backend já está rodando

# Frontend (porta 5173)  
netstat -an | findstr :5173
# Se estiver em uso, é sinal que frontend já está rodando

# Para matar processos se necessário (Windows)
taskkill /F /PID [PID_NUMBER]
```

**Verificação Rápida:**
- http://localhost:3009/health (deve responder)
- http://localhost:5173 (deve carregar página)

---

### **❌ ERRO: Dados não carregam após login**

**Sintomas:**
- Login bem-sucedido mas dashboard vazio
- Erro 401 nas APIs de dados
- Token JWT inválido

**Causa Raiz:** Problema de autenticação ou banco de dados

**Solução Garantida:**
```bash
# 1. Testar APIs protegidas
cd "S:\comp-glgarantias\r-glgarantias\backend"
node test_login_api.js

# 2. Verificar integridade do banco
node final_system_test.js

# 3. Se Supabase estiver com problema
node check_tables.js
```

---

## 🧪 COMANDOS DE DIAGNÓSTICO

### **Verificação Completa (SEMPRE execute primeiro)**
```bash
cd "S:\comp-glgarantias\r-glgarantias"
node VERIFICACAO_AUTOMATICA_SISTEMA.js
```

### **Teste de Conectividade**
```bash
# Backend health
curl http://localhost:3009/health

# Frontend loading
curl http://localhost:5173 | head -1

# Login API
curl -X POST "http://localhost:3009/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"guilherme@gmail.com","password":"123456"}'
```

### **Teste de Sistema Completo**
```bash
cd "S:\comp-glgarantias\r-glgarantias\backend"
node final_system_test.js
```

### **Verificação de Portas**
```bash
# Windows
netstat -an | findstr :3009
netstat -an | findstr :5173

# Verificar processos Node
tasklist | findstr node.exe
```

---

## 🔧 CORREÇÕES PREVENTIVAS

### **Sempre após mudanças no código:**
1. ✅ Executar: `node VERIFICACAO_AUTOMATICA_SISTEMA.js`
2. ✅ Verificar se não há porta 3005 em lugar algum
3. ✅ Testar login: `node backend/test_login_api.js`

### **Sempre antes de enviar para produção:**
1. ✅ `node backend/final_system_test.js`
2. ✅ Verificar todos os tests passando
3. ✅ Login manual no frontend funcionar

### **Se mudar configurações:**
1. ✅ Parar backend e frontend (Ctrl+C)
2. ✅ Executar verificação automática
3. ✅ Reiniciar os serviços

---

## 📞 FLUXO DE RESOLUÇÃO

```
1. ❓ Problema ocorreu
      ↓
2. 🔍 Executar: VERIFICACAO_AUTOMATICA_SISTEMA.js
      ↓
3. ❌ Se verificação falhar → Corrigir itens listados
   ✅ Se verificação passar → Ir para step 4
      ↓
4. 🧪 Executar: backend/final_system_test.js
      ↓
5. ❌ Se teste falhar → Verificar logs específicos
   ✅ Se teste passar → Sistema funcionando
      ↓
6. 🌐 Testar login manual no navegador
      ↓
7. ✅ SISTEMA FUNCIONANDO!
```

---

## 🎯 VERIFICAÇÃO RÁPIDA DE 30 SEGUNDOS

```bash
# Copie e cole este bloco completo:
echo "🔍 Verificação rápida..." && \
curl -s http://localhost:3009/health > /dev/null && echo "✅ Backend OK" || echo "❌ Backend FALHA" && \
curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend FALHA" && \
cd "S:\comp-glgarantias\r-glgarantias\backend" && \
curl -s -X POST "http://localhost:3009/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"guilherme@gmail.com","password":"123456"}' | \
  grep -q '"success":true' && echo "✅ Login OK" || echo "❌ Login FALHA"
```

**Se todos marcarem ✅:** Sistema está funcionando perfeitamente!
**Se algum marcar ❌:** Seguir troubleshooting específico acima.

---

## 📋 CHECKLIST DE RESOLUÇÃO

- [ ] Executei `VERIFICACAO_AUTOMATICA_SISTEMA.js`?
- [ ] Todas as verificações passaram?
- [ ] Backend responde em http://localhost:3009/health?
- [ ] Frontend carrega em http://localhost:5173?
- [ ] Login funciona via API (curl)?
- [ ] Executei `final_system_test.js`?
- [ ] Login manual no navegador funciona?

**Se todos marcados:** Problema resolvido! ✅
**Se algum não marcado:** Verificar seção específica acima.

---

**🔥 IMPORTANTE:** Este guia resolve 99% dos problemas. Se ainda houver problema, consulte `SISTEMA_FUNCIONANDO_PERFEITAMENTE.md` para informações técnicas detalhadas.