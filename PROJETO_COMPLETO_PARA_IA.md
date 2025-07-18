# DOCUMENTAÇÃO COMPLETA DO PROJETO - Sistema de Análise de Ordens de Serviço

## 🎯 CONTEXTO E OBJETIVO PRINCIPAL

Este é um projeto de desenvolvimento de um **Sistema de Análise de Ordens de Serviço** que processa planilhas Excel com dados de garantias de motores. O objetivo é criar um sistema 100% confiável que elimine a perda de dados durante o processamento.

### PROBLEMA ATUAL QUE ESTAMOS RESOLVENDO:
- **Perda de dados** durante processamento de planilhas Excel
- **Validação inadequada** de datas e status
- **Falhas de upload** frequentes
- **Falta de rastreabilidade** dos erros

---

## 📋 ESPECIFICAÇÕES TÉCNICAS DETALHADAS

### STACK TECNOLÓGICA DEFINIDA:
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Vite  
- **Banco de Dados**: Supabase (PostgreSQL)
- **UI/UX**: Tailwind CSS + shadcn/ui
- **Processamento**: biblioteca `xlsx` + validação customizada

### ESTRUTURA DE ARQUIVOS:
```
r-glgarantias/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── UploadController.ts
│   │   ├── services/
│   │   │   ├── ExcelAnalyzer.ts
│   │   │   ├── RobustDataProcessor.ts
│   │   │   └── RobustUploadService.ts
│   │   ├── validators/
│   │   │   └── DateValidator.ts
│   │   └── app.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/ (ainda não implementado)
├── shared/ (ainda não implementado)
├── .env.example
├── .gitignore
├── todo.md
├── project_summary.md
└── PROJETO_COMPLETO_PARA_IA.md (este arquivo)
```

---

## 📊 DADOS DE ENTRADA - PLANILHA EXCEL

### ARQUIVO FONTE:
- **Nome**: `GLú-Garantias.xlsx` (ou variações como `GLu-Garantias-TesteReal.xlsx`)
- **Tamanho**: +17 mil linhas (9.7 MB)
- **Aba importante**: "Tabela" (outras abas devem ser ignoradas)

### COLUNAS QUE DEVEM SER PROCESSADAS (11 colunas específicas):

1. **`NOrdem_Osv`** → `order_number` (VARCHAR(50) UNIQUE)
   - Exemplo: `121051`
   - Função: Número único da Ordem de Serviço
   - Regra: Se duplicado, atualizar OS existente com dados mais recentes

2. **`Data_OSv`** → `order_date` (DATE)
   - Exemplo: `15/07/2025 00:00:00`
   - Função: Data da Ordem de Serviço
   - Regra: Deve ser >= 2019 (filtro obrigatório)
   - Formatos aceitos: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Excel serial

3. **`Fabricante_Mot`** → `engine_manufacturer` (VARCHAR(100))
   - Exemplo: `MWM`
   - Função: Fabricante do motor

4. **`Descricao_Mot`** → `engine_description` (TEXT)
   - Exemplo: `MWM 4.07TCA`
   - Função: Tipo/descrição do motor

5. **`ModeloVei_Osv`** → `vehicle_model` (VARCHAR(100))
   - Exemplo: `VALMET 785`
   - Função: Modelo do veículo/equipamento

6. **`ObsCorpo_OSv`** → `raw_defect_description` (TEXT)
   - Exemplo: `SEM FORÇA, ESQUENTANDO MUITO *** INFORMAÇÃO SOBRE ESTE ATENDIMENTO NA ABA DADOS ADICIONAIS ***`
   - Função: Descrição bruta dos defeitos (será classificada futuramente)

7. **`RazaoSocial_Cli`** → `responsible_mechanic` (VARCHAR(100))
   - Exemplo: `ANTONIO ALVES DA LUZ`
   - Função: Nome do mecânico responsável

8. **`TotalProd_OSv`** → `parts_total` (DECIMAL(12,2))
   - Exemplo: `1134` → deve resultar em `567` (dividido por 2)
   - **REGRA CRÍTICA**: Valor do Excel DEVE ser dividido por 2
   - Armazenar valor original em `original_parts_value`

9. **`TotalServ_OSv`** → `labor_total` (DECIMAL(12,2))
   - Exemplo: `200`
   - Função: Total de serviços (valor direto, sem divisão)

10. **`Total_OSv`** → `grand_total` (DECIMAL(12,2))
    - Exemplo: `1134`
    - **REGRA DE VALIDAÇÃO**: `(TotalProd_OSv/2) + TotalServ_OSv` DEVE ser igual a `Total_OSv`
    - Campo `calculation_verified` deve ser TRUE se a conta bater

11. **`Status_OSv`** → `order_status` (VARCHAR(10))
    - Valores aceitos: **APENAS** `G`, `GO`, `GU`
    - Qualquer outro valor deve ser rejeitado

### COLUNAS QUE DEVEM SER IGNORADAS:
Todas as outras colunas presentes no Excel (Codigo_Cli, Interm_OSv, Hora_OSv, etc.) devem ser descartadas.

---

## 🗄️ ESQUEMA DO BANCO DE DADOS (SUPABASE)

### TABELAS CRIADAS E FUNCIONAIS:

#### 1. `service_orders` (Tabela principal)
```sql
CREATE TABLE service_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date DATE NOT NULL,
    engine_manufacturer VARCHAR(100),
    engine_description TEXT,
    vehicle_model VARCHAR(100),
    raw_defect_description TEXT,
    responsible_mechanic VARCHAR(100),
    parts_total DECIMAL(12,2),
    labor_total DECIMAL(12,2),
    grand_total DECIMAL(12,2),
    order_status VARCHAR(10) CHECK (order_status IN ('G', 'GO', 'GU')),
    original_parts_value DECIMAL(12,2),
    calculation_verified BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `file_processing_logs` (Logs de processamento)
```sql
CREATE TABLE file_processing_logs (
    id BIGSERIAL PRIMARY KEY,
    upload_id UUID UNIQUE NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    total_rows_in_excel INTEGER,
    rows_with_data INTEGER,
    rows_after_date_filter INTEGER,
    rows_after_status_filter INTEGER,
    rows_with_calculation_errors INTEGER,
    final_valid_rows INTEGER,
    rows_inserted INTEGER,
    rows_updated INTEGER,
    rows_rejected INTEGER,
    processing_time_ms INTEGER,
    memory_usage_mb INTEGER,
    status VARCHAR(20) CHECK (status IN ('STARTED', 'PROCESSING', 'SUCCESS', 'FAILED', 'PARTIAL')),
    error_details JSONB,
    warnings JSONB,
    date_validation_errors JSONB,
    status_validation_errors JSONB,
    calculation_errors JSONB,
    processed_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `processing_errors` (Erros por linha)
```sql
CREATE TABLE processing_errors (
    id BIGSERIAL PRIMARY KEY,
    upload_id UUID NOT NULL,
    row_number INTEGER NOT NULL,
    excel_row_data JSONB,
    error_type VARCHAR(50),
    error_message TEXT,
    column_name VARCHAR(100),
    original_value TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (upload_id) REFERENCES file_processing_logs(upload_id)
);
```

#### 4. `system_settings` (Configurações)
```sql
CREATE TABLE system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB,
    setting_description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### CREDENCIAIS DE ACESSO:
- **URL**: `https://njdmpdpglpidamparwtr.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZG1wZHBnbHBpZGFtcGFyd3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDc4ODYsImV4cCI6MjA2ODQyMzg4Nn0.lecWLobNMt4cCCo3E18AYfMoINvcdSPKxqETgIhXmzc`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZG1wZHBnbHBpZGFtcGFyd3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0Nzg4NiwiZXhwIjoyMDY4NDIzODg2fQ.jIPp_CrjZZZ17hfjj7ok4cXw-5wOr7pPIwkG76RNJxk`

---

## 🚀 STATUS ATUAL DO PROJETO

### FASE 1: ✅ CONCLUÍDA
- [x] Ambiente de desenvolvimento configurado
- [x] Repositório GitHub criado e sincronizado
- [x] Banco de dados Supabase criado com esquema otimizado
- [x] Conexão backend-banco testada e funcionando
- [x] Estrutura de pastas organizada

### FASE 2: 🚀 EM ANDAMENTO (PROBLEMA CRÍTICO IDENTIFICADO)
- [x] `ExcelAnalyzer.ts` implementado
- [x] `DateValidator.ts` implementado  
- [x] `RobustDataProcessor.ts` implementado (COM ERRO DE SINTAXE)
- [x] `RobustUploadService.ts` implementado
- [x] `UploadController.ts` implementado
- [x] Endpoint `/api/v1/upload` criado
- [x] Servidor Node.js rodando na porta 3001

### PROBLEMA ATUAL QUE PRECISA SER RESOLVIDO:
1. **Erro de sintaxe no `RobustDataProcessor.ts`** - arquivo corrompido durante edição
2. **Todas as 220 linhas da planilha estão sendo rejeitadas** - validação muito restritiva
3. **Logs mostram que o upload funciona, mas processamento falha**

---

## 🔧 FLUXO DE PROCESSAMENTO ESPERADO

### 1. UPLOAD DA PLANILHA
- Usuário envia arquivo Excel via POST `/api/v1/upload`
- Sistema valida tipo de arquivo (.xlsx, .xls)
- Sistema verifica existência da aba "Tabela"

### 2. LEITURA E MAPEAMENTO
- Ler apenas a aba "Tabela"
- Extrair cabeçalhos da primeira linha
- Mapear as 11 colunas específicas
- Descartar todas as outras colunas

### 3. VALIDAÇÃO LINHA POR LINHA
Para cada linha:
- **Campos obrigatórios**: `NOrdem_Osv`, `Data_OSv`, `Status_OSv`
- **Validação de data**: Formato válido + >= 2019
- **Validação de status**: Apenas 'G', 'GO', 'GU'
- **Validação de cálculo**: `(TotalProd_OSv/2) + TotalServ_OSv = Total_OSv`

### 4. TRANSFORMAÇÃO DOS DADOS
- Dividir `TotalProd_OSv` por 2
- Converter datas para formato padrão
- Normalizar strings (trim, uppercase para status)
- Calcular `calculation_verified`

### 5. INSERÇÃO NO BANCO
- Inserir dados válidos na `service_orders`
- Registrar logs em `file_processing_logs`
- Registrar erros em `processing_errors`
- **NÃO é transacional** - inserir o que for válido

---

## 📁 REPOSITÓRIO GITHUB

### INFORMAÇÕES DE ACESSO:
- **URL**: `https://github.com/guilhermevnaia/r-glgarantias.git`
- **Token**: `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`

### ARQUIVOS IMPORTANTES NO REPOSITÓRIO:
- `todo.md` - Lista de tarefas e progresso
- `project_summary.md` - Resumo do projeto
- `backend/src/` - Código fonte do backend
- `GLu-Garantias-TesteReal.xlsx` - Planilha de teste com dados reais

---

## 🎯 PRÓXIMOS PASSOS CRÍTICOS

### IMEDIATO (RESOLVER AGORA):
1. **Corrigir erro de sintaxe no `RobustDataProcessor.ts`**
   - Arquivo foi corrompido durante edição
   - Recriar o arquivo com a lógica correta
   - Focar na leitura correta dos cabeçalhos Excel

2. **Depurar rejeição de linhas**
   - Adicionar logs detalhados para ver exatamente quais validações estão falhando
   - Verificar se os nomes das colunas estão sendo lidos corretamente
   - Testar com uma linha específica da planilha

3. **Testar processamento completo**
   - Upload da planilha `GLu-Garantias-TesteReal.xlsx`
   - Verificar se dados chegam ao Supabase
   - Validar se as regras de negócio estão sendo aplicadas

### MÉDIO PRAZO:
1. Implementar frontend básico para upload
2. Criar dashboard para visualização dos dados
3. Implementar sistema de classificação de defeitos (Fase 6)

---

## 🔍 INFORMAÇÕES TÉCNICAS ESPECÍFICAS

### FORMATO DOS DADOS NO EXCEL:
- **Datas**: Podem vir como número serial do Excel (ex: 45737) ou string (15/07/2025)
- **Status**: Sempre string, pode ter espaços extras
- **Números**: Podem ter formatação de moeda ou separadores de milhares
- **Texto**: Pode conter caracteres especiais, acentos, quebras de linha

### REGRAS DE VALIDAÇÃO RIGOROSAS:
- **Data < 2019**: Rejeitar linha
- **Status != 'G','GO','GU'**: Rejeitar linha  
- **Campos obrigatórios vazios**: Rejeitar linha
- **Cálculo incorreto**: Registrar warning, mas aceitar linha
- **Dados numéricos inválidos**: Rejeitar linha

### PERFORMANCE ESPERADA:
- **17 mil linhas**: Processar em < 30 segundos
- **Memória**: < 500MB durante processamento
- **Logs**: Detalhados para cada erro
- **Retry**: Sistema deve tentar novamente em caso de falha

---

## 💡 CONTEXTO ADICIONAL IMPORTANTE

### HISTÓRICO DO PROJETO:
- Este é um projeto novo, sem código legado
- Foco em robustez e confiabilidade
- Cliente tem experiência com perda de dados em sistemas anteriores
- Tolerância zero para falhas de processamento

### EXPECTATIVAS DO CLIENTE:
- Sistema deve processar 100% dos dados válidos
- Logs detalhados para auditoria
- Interface simples e intuitiva
- Deploy em produção após validação completa

### ARQUIVOS DE TESTE DISPONÍVEIS:
- `GLu-Garantias-TesteReal.xlsx` - 220 linhas de dados reais de 2025
- Todas as linhas têm status 'G' e datas de março/2025
- Dados já validados manualmente pelo cliente

---

## 🚨 PROBLEMAS CONHECIDOS E SOLUÇÕES

### PROBLEMA 1: Erro de Sintaxe no RobustDataProcessor
**Sintoma**: Erro de compilação TypeScript
**Causa**: Arquivo corrompido durante edição
**Solução**: Recriar arquivo com lógica correta

### PROBLEMA 2: Rejeição de Todas as Linhas
**Sintoma**: 220 linhas processadas, 0 válidas
**Causa**: Validação muito restritiva ou mapeamento incorreto de colunas
**Solução**: Adicionar logs detalhados e ajustar validação

### PROBLEMA 3: Leitura de Cabeçalhos Excel
**Sintoma**: Colunas não encontradas
**Causa**: `XLSX.utils.sheet_to_json` pode alterar nomes de colunas
**Solução**: Usar `{ header: 1 }` para ler cabeçalhos como array

---

## 📞 INSTRUÇÕES PARA NOVA IA

Se você está assumindo este projeto:

1. **Leia este documento completamente** - contém todas as informações necessárias
2. **Verifique o repositório GitHub** - código mais recente está lá
3. **Teste a conexão com Supabase** - credenciais estão neste documento
4. **Foque no problema atual** - erro de sintaxe no RobustDataProcessor
5. **Use a planilha de teste** - `GLu-Garantias-TesteReal.xlsx` para validação
6. **Mantenha logs detalhados** - cliente precisa de rastreabilidade total
7. **Atualize este documento** - quando fizer alterações significativas

### COMANDOS ÚTEIS:
```bash
# Clonar repositório
git clone https://github.com/guilhermevnaia/r-glgarantias.git

# Instalar dependências
cd r-glgarantias/backend && npm install

# Compilar TypeScript
npm run build

# Iniciar servidor
npm start

# Testar upload
curl -X POST -F "file=@GLu-Garantias-TesteReal.xlsx" http://localhost:3001/api/v1/upload
```

**LEMBRE-SE**: O cliente valoriza precisão, comunicação clara e resultados concretos. Evite se perder em detalhes técnicos desnecessários e foque em resolver o problema atual.

