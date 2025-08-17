# 🔒 SISTEMA NOVO - ARQUIVOS QUE DEVEM SER PRESERVADOS

⚠️ **ATENÇÃO: NUNCA EXCLUA ESTES ARQUIVOS - SÃO O SISTEMA FUNCIONANDO!**

## 🛡️ BACKEND - ARQUIVOS CRÍTICOS (NÃO TOCAR):

### 🤖 Serviços de IA (NOVO SISTEMA):
- ✅ `src/services/SimpleAIService.ts` - **SERVIÇO PRINCIPAL DE IA**
- ✅ `src/controllers/AIController.ts` - **CONTROLLER PRINCIPAL** 
- ✅ `src/controllers/UploadController.ts` - **UPLOAD COM IA**
- ✅ `src/controllers/UploadControllerV2.ts` - **UPLOAD V2**

### 📊 Scripts de Execução (FUNCIONAIS):
- ✅ `execute_new_ai_classification.js` - **CLASSIFICAÇÃO PRINCIPAL**
- ✅ `simple_health_check.js` - **AUDITORIA DO SISTEMA**

### ⚙️ Configurações (NECESSÁRIAS):
- ✅ `tsconfig.json` - **CONFIGURAÇÃO TYPESCRIPT**
- ✅ `package.json` - **DEPENDÊNCIAS**
- ✅ `.env` - **VARIÁVEIS DE AMBIENTE**

---

## 🗑️ ARQUIVOS ANTIGOS (PODEM SER EXCLUÍDOS):

### 📁 Backups Criados:
- ❌ `OLD_AI_SERVICES_BACKUP/` - **PASTA INTEIRA**
- ❌ `OLD_SCRIPTS_BACKUP/` - **PASTA INTEIRA**

### 🧹 Scripts de Investigação (TEMPORÁRIOS):
- ❌ `comprehensive_system_audit.js`
- ❌ `investigate_data_chaos.js` 
- ❌ `debug_classification_issue.js`
- ❌ `rebuild_classification_system.js`
- ❌ `complete_ai_system_reset.js`

---

## 🎯 FRONTEND - ARQUIVOS IMPORTANTES:

### 🔗 Serviços (FUNCIONAIS):
- ✅ `src/services/aiService.ts` - **INTEGRAÇÃO COM IA**
- ✅ `src/hooks/useAI.ts` - **HOOKS PARA IA**

### 🧩 Componentes (FUNCIONAIS):
- ✅ `src/components/SimpleDefectCard.tsx` - **EXIBIÇÃO DE DEFEITOS**
- ✅ `src/components/HierarchicalDefectCard.tsx` - **CARD HIERÁRQUICO**

### 📄 Páginas (IMPORTANTES):
- ✅ `src/pages/Defects.tsx` - **PÁGINA DE DEFEITOS**
- ✅ `src/pages/Dashboard.tsx` - **DASHBOARD**
- ✅ `src/pages/ServiceOrders.tsx` - **ORDENS DE SERVIÇO**

---

## 📋 SUPABASE - TABELAS ESSENCIAIS:

### 🗃️ Tabelas do Sistema Novo:
- ✅ `service_orders` - **DADOS PRINCIPAIS**
- ✅ `defect_classifications` - **CLASSIFICAÇÕES DA IA**
- ✅ `defect_categories` - **6 CATEGORIAS NOVAS**

### ⚠️ NUNCA EXECUTE ESTES COMANDOS:
```sql
-- ❌ NÃO EXECUTE - VAI QUEBRAR O SISTEMA:
DROP TABLE defect_classifications;
DROP TABLE defect_categories;
DELETE FROM defect_classifications;
```

---

## 🔍 COMO IDENTIFICAR CÓDIGO ANTIGO vs NOVO:

### ✅ CÓDIGO NOVO (PRESERVAR):
- Usa `SimpleAIService`
- Tem comentários "NOVO SISTEMA"
- Criado/modificado após o reset
- Funciona com 6 categorias

### ❌ CÓDIGO ANTIGO (PODE EXCLUIR):
- Usa `GroqAIService`, `EnhancedLocalAIService`, etc.
- Referências a 11+ categorias
- Scripts com "fix_", "force_", "debug_" no nome
- Está nas pastas de backup

---

## 🚨 REGRAS DE OURO:

1. **SEMPRE verificar** se é SimpleAIService antes de excluir
2. **NUNCA tocar** em arquivos da lista ✅ 
3. **SEMPRE fazer backup** antes de limpezas
4. **CONFIRMAR funcionamento** após qualquer mudança

---

**Data de criação deste sistema: 12/08/2025**
**Status: FUNCIONANDO - NÃO MEXER!**