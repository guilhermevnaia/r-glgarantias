# Guia de Configuração do Ambiente de Desenvolvimento Local - R-GLGarantias

Este documento fornece instruções detalhadas para configurar o ambiente de desenvolvimento local do projeto R-GLGarantias, permitindo implementar as melhorias sugeridas e continuar o desenvolvimento do aplicativo.

## 📋 Pré-requisitos

### Software Necessário:
- **Node.js** (versão 18 ou superior) - [Download](https://nodejs.org/)
- **npm** ou **pnpm** (gerenciador de pacotes)
- **Git** - [Download](https://git-scm.com/)
- **Editor de código** (recomendado: VS Code)

### Extensões Recomendadas para VS Code:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- ESLint

## 🚀 Configuração Inicial

### 1. Clonar o Repositório

```bash
git clone https://github.com/guilhermevnaia/r-glgarantias.git
cd r-glgarantias
```

### 2. Configurar o Backend

```bash
# Navegar para o diretório do backend
cd backend

# Instalar dependências
npm install

# Criar arquivo de ambiente
cp .env.example .env
# ou criar manualmente:
touch .env
```

#### Configurar o arquivo `.env` do backend:

```env
# backend/.env
SUPABASE_URL=https://njdmpdpglpidamparwtr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZG1wZHBnbHBpZGFtcGFyd3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0Nzg4NiwiZXhwIjoyMDY4NDIzODg2fQ.jIPp_CrjZZZ17hfjj7ok4cXw-5wOr7pPIwkG76RNJxk
PORT=3004
```

#### Compilar e iniciar o backend:

```bash
# Compilar TypeScript
npm run build

# Iniciar o servidor
npm start

# Ou para desenvolvimento com hot reload:
npm run dev
```

### 3. Configurar o Frontend

```bash
# Navegar para o diretório do frontend (em um novo terminal)
cd frontend

# Instalar dependências (pode ser necessário usar --legacy-peer-deps)
npm install --legacy-peer-deps

# Iniciar o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173/`

## 🔧 Resolução de Problemas Comuns

### Problema 1: Conflitos de Dependências (ERESOLVE)

**Sintoma:** Erro `ERESOLVE unable to resolve dependency tree`

**Solução:**
```bash
# Limpar cache do npm
npm cache clean --force

# Instalar com --legacy-peer-deps
npm install --legacy-peer-deps

# Ou usar --force (menos recomendado)
npm install --force
```

### Problema 2: Erro PostCSS/Tailwind CSS

**Sintoma:** `Failed to load PostCSS config` ou `Cannot find module '@tailwindcss/postcss'`

**Solução:**
```bash
# Instalar dependências PostCSS
npm install -D @tailwindcss/postcss autoprefixer

# Verificar se o arquivo postcss.config.js está correto:
```

```javascript
// frontend/postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### Problema 3: Erro de Conexão com Supabase

**Sintoma:** `Invalid API key` no backend

**Soluções:**

1. **Verificar chaves no painel Supabase:**
   - Acesse [supabase.com](https://supabase.com)
   - Vá para Project Settings → API
   - Copie a `service_role` key (não a `anon` key)

2. **Verificar configurações RLS:**
   - No painel Supabase, vá para Authentication → Policies
   - Verifique se RLS está desabilitado para a tabela `service_orders`
   - Ou configure políticas adequadas

3. **Testar conexão diretamente:**
```bash
# No diretório backend, executar:
node dist/testSupabaseConnection.js
```

### Problema 4: Porta já em uso

**Sintoma:** `Error: listen EADDRINUSE: address already in use :::3004`

**Solução:**
```bash
# Encontrar processo usando a porta
lsof -ti:3004

# Matar o processo
kill -9 <PID>

# Ou usar uma porta diferente no .env
PORT=3005
```

## 🛠️ Estrutura do Projeto

```
r-glgarantias/
├── backend/                 # API Node.js/TypeScript
│   ├── src/
│   │   ├── controllers/     # Controladores da API
│   │   ├── services/        # Lógica de negócio
│   │   └── app.ts          # Configuração principal
│   ├── dist/               # Código compilado
│   ├── package.json
│   └── .env                # Variáveis de ambiente
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   └── utils/          # Utilitários
│   ├── public/             # Arquivos estáticos
│   └── package.json
└── docs/                   # Documentação
```

## 📝 Scripts Úteis

### Backend:
```bash
# Compilar TypeScript
npm run build

# Iniciar em produção
npm start

# Desenvolvimento com hot reload
npm run dev

# Testar conexão Supabase
node dist/testSupabaseConnection.js
```

### Frontend:
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint
```

## 🧪 Testando o Sistema

### 1. Testar Backend

```bash
# Com o backend rodando, testar upload:
curl -X POST -F "file=@GLú-Garantias.xlsx" http://localhost:3004/api/upload
```

### 2. Testar Frontend

1. Acesse `http://localhost:5173/`
2. Navegue para a página de Upload
3. Faça upload da planilha `GLú-Garantias.xlsx`
4. Verifique o Dashboard para ver os resultados

### 3. Testar Conexão Supabase

```bash
# No diretório backend:
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('service_orders').select('count', { count: 'exact', head: true }).then(console.log);
"
```

## 🎨 Implementando as Melhorias Sugeridas

### Passo 1: Configurar Notificações Toast

```bash
# A biblioteca 'sonner' já está instalada
# Adicionar no App.tsx:
```

```typescript jsx
// frontend/src/App.tsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      {/* Seus componentes existentes */}
      <Toaster position="top-right" />
    </>
  );
}
```

### Passo 2: Implementar Validação de Arquivos

```bash
# Instalar biblioteca para ler Excel:
npm install xlsx
npm install -D @types/xlsx
```

```typescript jsx
// frontend/src/utils/fileValidation.ts
// (Usar o código do documento de sugestões)
```

### Passo 3: Adicionar Indicadores de Progresso

```typescript jsx
// frontend/src/components/pages/UploadExcel.tsx
// (Implementar usando o código sugerido)
```

### Passo 4: Melhorar o Dashboard

```typescript jsx
// frontend/src/components/pages/Dashboard.tsx
// (Implementar os cards de status sugeridos)
```

## 🚀 Deploy e Produção

### Opção 1: Deploy Manual

```bash
# Build do frontend
cd frontend
npm run build

# Build do backend
cd ../backend
npm run build

# Copiar arquivos para servidor
```

### Opção 2: Deploy com Vercel (Frontend)

```bash
# Instalar Vercel CLI
npm install -g vercel

# No diretório frontend:
vercel

# Seguir instruções
```

### Opção 3: Deploy com Railway/Render (Backend)

1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Deploy automático

## 📚 Recursos Adicionais

### Documentação:
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Supabase Documentation](https://supabase.com/docs)

### Ferramentas de Desenvolvimento:
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## 🆘 Suporte e Troubleshooting

### Logs Importantes:

1. **Backend logs:**
   - Verifique o console onde o `npm start` está rodando
   - Logs de erro do Supabase aparecem aqui

2. **Frontend logs:**
   - Abra DevTools (F12) no navegador
   - Verifique Console e Network tabs

3. **Supabase logs:**
   - No painel Supabase, vá para Logs → API
   - Procure por erros relacionados às suas tentativas

### Comandos de Debug:

```bash
# Verificar versões
node --version
npm --version

# Verificar portas em uso
netstat -tulpn | grep :3004
netstat -tulpn | grep :5173

# Limpar tudo e reinstalar
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Contatos para Suporte:

- **Issues do GitHub:** [Criar issue](https://github.com/guilhermevnaia/r-glgarantias/issues)
- **Documentação do projeto:** Consulte os arquivos `.md` no repositório

---

*Este guia deve ser suficiente para configurar o ambiente de desenvolvimento local e implementar as melhorias sugeridas. Em caso de dúvidas, consulte a documentação oficial das tecnologias utilizadas ou crie uma issue no repositório.*

