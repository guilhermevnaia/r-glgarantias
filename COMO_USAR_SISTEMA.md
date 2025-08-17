# 🚀 COMO USAR O SISTEMA GL-GARANTIAS

## ⚡ INÍCIO RÁPIDO

### **Opção 1: Inicialização Automática (RECOMENDADA)**
```
🖱️ Duplo clique em: INICIAR_SISTEMA_COMPLETO.bat
```
**Resultado:** Verifica tudo automaticamente e inicia backend + frontend

### **Opção 2: Inicialização Manual**
```bash
# Terminal 1 (Backend)
cd "S:\comp-glgarantias\r-glgarantias\backend"
npm start

# Terminal 2 (Frontend)  
cd "S:\comp-glgarantias\r-glgarantias\frontend"
npm run dev
```

## 🔑 LOGIN

- **URL:** http://localhost:5173
- **Email:** `guilherme@gmail.com`
- **Senha:** `123456`

## 🔧 VERIFICAÇÃO DE PROBLEMAS

Se algo não funcionar:

```bash
# Executar verificação automática
node VERIFICACAO_AUTOMATICA_SISTEMA.js

# Teste completo do sistema
cd backend
node final_system_test.js
```

## 📖 DOCUMENTAÇÃO COMPLETA

Para detalhes técnicos e troubleshooting completo:
👉 **[SISTEMA_FUNCIONANDO_PERFEITAMENTE.md](SISTEMA_FUNCIONANDO_PERFEITAMENTE.md)**

## 🆘 AJUDA RÁPIDA

| Problema | Solução |
|----------|---------|
| 🔥 "Connection Refused" | Verificar se backend está na porta 3009 |
| 🔥 "Credenciais inválidas" | Executar `node backend/fix_user_issues.js` |
| 🔥 Tela em branco | Verificar se frontend está na porta 5173 |
| 🔥 Erro de porta | Todas as URLs devem usar porta 3009 |

---
**✨ Sistema testado e funcionando em 14/08/2025**