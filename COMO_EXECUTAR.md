# 🚀 Como Executar o Sistema GL-Garantias

## ⚡ Início Super Rápido

### Opção 1: Comando Único (Recomendado)
```bash
npm run setup && npm run dev
```

### Opção 2: Scripts Windows
1. **Backend**: Clique duas vezes em `start-backend.bat`
2. **Frontend**: Clique duas vezes em `start-frontend.bat`

### Opção 3: Manual
```bash
# Instalar todas as dependências
npm run install:all

# Configurar ambiente (copiar .env.example)
cp backend/.env.example backend/.env

# Executar ambos simultaneamente
npm run dev
```

## 📋 Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn
- Arquivo Excel com aba "Tabela" para upload

## 🌐 URLs do Sistema
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3006
- **Health Check**: http://localhost:3006/health

## 📤 Como Fazer Upload

### 1. Preparar Arquivo Excel
- Arquivo deve ter extensão `.xlsx` ou `.xls`
- **OBRIGATÓRIO**: Deve conter uma aba chamada **"Tabela"**
- Tamanho máximo: 100MB
- Dados devem estar formatados corretamente

### 2. Processo de Upload
1. Acesse a aba "Upload Excel"
2. Arraste e solte o arquivo ou clique para selecionar
3. Clique em "Processar Arquivo"
4. Aguarde o processamento (pode levar alguns minutos)
5. Verifique os resultados e a integridade do sistema

### 3. Estrutura Esperada da Aba "Tabela"
O arquivo Excel deve conter as seguintes colunas (o sistema é flexível com nomes):
- Número da OS
- Data da OS
- Fabricante do Motor
- Descrição do Motor
- Modelo do Veículo
- Descrição do Defeito
- Mecânico Responsável
- Valores (Peças, Serviços, etc.)
- Status (G, GO, GU)

## 🔧 Funcionalidades Disponíveis

### Dashboard
- **Overview**: Visão geral dos dados
- **Gráficos**: Visualizações por status, modelos e mecânicos
- **Análise**: Comparação mês-a-mês com tendências
- **Avaliação**: Preparado para integração com IA

### Ordens de Serviço
- **Listagem**: Paginação eficiente com 50 registros por página
- **Filtros**: Por status, ano, mês, fabricante, mecânico e modelo
- **Busca**: Texto livre em múltiplos campos
- **Ações**: Ver detalhes, imprimir, exportar individual
- **Exportação**: CSV com todos os dados filtrados

### Upload Excel
- **Validação**: Formato, tamanho e estrutura do arquivo
- **Processamento**: Em lotes otimizados para performance
- **Monitoramento**: Progresso em tempo real
- **Integridade**: Verificação automática pós-upload
- **Relatórios**: Detalhes completos do processamento

## ⚠️ Solução de Problemas

### Backend não inicia
- Verifique se Node.js está instalado: `node --version`
- Instale dependências: `cd backend && npm install`
- Verifique se porta 3006 está disponível

### Frontend não conecta com Backend
- Confirme que backend está rodando em http://localhost:3006
- Verifique console do navegador para erros de CORS
- Teste health check: http://localhost:3006/health

### Erro no Upload
- **Aba "Tabela" não encontrada**: Renomeie a aba do Excel para "Tabela"
- **Arquivo muito grande**: Reduza o tamanho para menos de 100MB
- **Formato inválido**: Use apenas .xlsx ou .xls
- **Dados inválidos**: Verifique datas (2019-2025) e status (G/GO/GU)

### Performance Lenta
- Sistema processa até 10.000 registros por vez
- Arquivos grandes podem levar alguns minutos
- Monitor de progresso mostra status em tempo real

## 📊 Status e Labels
- **G**: Garantia
- **GO**: Garantia de Oficina  
- **GU**: Garantia de Usinagem

**Importante**: Menos garantias = melhor performance da empresa

## 🎯 Próximos Passos
1. Faça upload de um arquivo de teste pequeno primeiro
2. Verifique se todos os dados aparecem corretamente
3. Use os filtros e funcionalidades de exportação
4. Configure a integração com IA na aba "Avaliação" quando necessário

## 📞 Suporte
- Verifique logs do console (F12 no navegador)
- Logs do backend aparecem no terminal
- Sistema de integridade detecta e reporta problemas automaticamente