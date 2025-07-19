# 🎨 PLANO DETALHADO - FRONTEND LÚCIO RETÍFICAS

## 🎯 OBJETIVO
Implementar frontend seguindo EXATAMENTE o design especificado para o sistema "LÚCIO - Retíficas de Motores"

## 📋 SITUAÇÃO ATUAL
- ✅ **Backend**: 100% funcional (porta 3004)
- ✅ **Dados**: 220 ordens de serviço no Supabase
- ✅ **Base React**: Configurado com TypeScript + Tailwind
- ✅ **API**: Endpoints prontos para consumo

---

## 🚀 FASE 3A: ESTRUTURA BASE (IMEDIATO)

### 1. **DEPENDÊNCIAS NECESSÁRIAS**
```bash
# Instalações obrigatórias
npm install react-router-dom lucide-react
npm install @types/react-router-dom
npm install axios
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

### 2. **ESTRUTURA DE PASTAS**
```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MainLayout.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Alert.tsx
│   │   └── Upload.tsx
│   └── pages/
│       ├── Dashboard.tsx
│       ├── UploadExcel.tsx
│       ├── ServiceOrders.tsx
│       └── NotFound.tsx
├── hooks/
│   ├── useApi.ts
│   └── useUpload.ts
├── services/
│   ├── api.ts
│   └── types.ts
├── styles/
│   └── globals.css
└── utils/
    └── cn.ts
```

### 3. **CONFIGURAÇÃO TAILWIND (CORES ESPECÍFICAS)**
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta LÚCIO
        primary: {
          DEFAULT: '#1e40af', // Azul escuro
          50: '#eff6ff',
          900: '#1e3a8a'
        },
        sidebar: {
          DEFAULT: '#1f2937', // Cinza escuro
          light: '#374151'
        },
        text: {
          primary: '#111827',
          secondary: '#6b7280'
        },
        error: '#dc2626',
        success: '#059669'
      },
      spacing: {
        'sidebar': '200px'
      }
    }
  },
  plugins: []
}
```

---

## 🎨 FASE 3B: COMPONENTES PRINCIPAIS

### 1. **SIDEBAR - MENU LATERAL**
**Especificações exatas:**
- Largura: 200px fixa
- Cor: #1f2937 (cinza escuro)
- Logo: "LÚCIO" (branco, bold) + "Retíficas de Motores" (cinza claro)
- Menu items com ícones Lucide React

### 2. **LAYOUT PRINCIPAL**
**Estrutura:**
- Sidebar fixa à esquerda
- Área principal com header + conteúdo
- Responsivo (sidebar colapsível)

### 3. **DASHBOARD - TELA 1**
**Elementos:**
- Header: "Análise de Garantias" + subtítulo
- Botão: "🔄 Atualizado agora"
- Alert vermelho: "Erro Crítico: Nenhuma data com dados foi encontrada"
- Área principal limpa

### 4. **UPLOAD EXCEL - TELA 2**
**Elementos:**
- Header: "Upload Excel" + subtítulo
- Card principal com área de drag & drop
- Instruções numeradas (1, 2, 3)
- Botão "📁 Selecionar Arquivo"

---

## 🔧 FASE 3C: INTEGRAÇÃO COM BACKEND

### 1. **SERVIÇOS API**
```typescript
// services/api.ts
const API_BASE_URL = 'http://localhost:3004';

export const uploadService = {
  uploadExcel: (file: File) => {...},
  getServiceOrders: () => {...},
  getUploadLogs: () => {...}
};
```

### 2. **HOOKS PERSONALIZADOS**
```typescript
// hooks/useUpload.ts
export const useUpload = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  // ... lógica de upload
};
```

### 3. **TIPOS TYPESCRIPT**
```typescript
// services/types.ts
export interface ServiceOrder {
  id: number;
  order_number: string;
  order_date: string;
  order_status: 'G' | 'GO' | 'GU';
  // ... outros campos
}
```

---

## 📱 FASE 3D: RESPONSIVIDADE

### 1. **BREAKPOINTS**
- Desktop: >= 1024px (layout completo)
- Tablet: 768px - 1023px (sidebar colapsível)
- Mobile: < 768px (sidebar drawer)

### 2. **COMPONENTES RESPONSIVOS**
- Sidebar: `hidden md:block` / `drawer overlay`
- Header: Botão hambúrguer em mobile
- Cards: Stack vertical em mobile

---

## 🎯 FASE 3E: FUNCIONALIDADES AVANÇADAS

### 1. **UPLOAD COM FEEDBACK**
- Drag & drop funcional
- Progress bar
- Validação de tipos (.xlsx, .xls)
- Feedback visual de sucesso/erro

### 2. **LISTAGEM DE ORDENS**
- Tabela com dados reais do Supabase
- Filtros por data, status, mecânico
- Paginação
- Busca

### 3. **DASHBOARD REAL**
- Gráficos com dados reais
- Estatísticas por período
- Métricas de defeitos

---

## ⚡ CRONOGRAMA DE IMPLEMENTAÇÃO

### **DIA 1-2: ESTRUTURA BASE**
- [x] Configurar dependências
- [ ] Criar estrutura de pastas
- [ ] Configurar roteamento
- [ ] Implementar layout principal

### **DIA 3-4: COMPONENTES VISUAIS**
- [ ] Sidebar com menu
- [ ] Headers das páginas
- [ ] Cards e componentes UI
- [ ] Área de upload

### **DIA 5-6: INTEGRAÇÃO**
- [ ] Conectar com backend
- [ ] Implementar upload
- [ ] Buscar dados do Supabase
- [ ] Testes de integração

### **DIA 7: POLISH & DEPLOY**
- [ ] Responsividade
- [ ] Testes finais
- [ ] Deploy (Vercel/Netlify)
- [ ] Documentação

---

## 🎨 DESIGN SYSTEM - COMPONENTES EXATOS

### **CORES OFICIAIS:**
```css
:root {
  --primary-blue: #1e40af;
  --sidebar-gray: #1f2937;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --error-red: #dc2626;
  --success-green: #059669;
}
```

### **TIPOGRAFIA:**
- Logo: font-bold text-xl
- Headers: font-bold text-2xl
- Subtitles: text-sm text-gray-500
- Body: text-base

### **ESPAÇAMENTOS:**
- Sidebar: w-[200px]
- Padding: p-4, p-6
- Gaps: gap-4, gap-6
- Margins: mb-4, mb-6

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

### **VISUAL:**
- [ ] Idêntico ao design especificado
- [ ] Paleta de cores exata
- [ ] Tipografia consistente
- [ ] Espaçamentos corretos

### **FUNCIONAL:**
- [ ] Roteamento funcionando
- [ ] Upload com drag & drop
- [ ] Integração com backend
- [ ] Feedback visual adequado

### **TÉCNICO:**
- [ ] TypeScript sem erros
- [ ] Responsivo em todos os breakpoints
- [ ] Performance otimizada
- [ ] Acessibilidade básica

---

## 🚀 PRÓXIMAS AÇÕES IMEDIATAS

1. **Instalar dependências extras**
2. **Criar estrutura de componentes**
3. **Implementar Sidebar exata**
4. **Configurar roteamento**
5. **Conectar com backend funcionando**

**O frontend pode ser implementado AGORA usando os dados reais do Supabase (220 ordens de serviço) e a API funcionando na porta 3004.**