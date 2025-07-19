/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta LÚCIO - Cores exatas do design
        primary: {
          DEFAULT: '#1e40af', // Azul escuro
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        sidebar: {
          DEFAULT: '#1f2937', // Cinza escuro da sidebar
          light: '#374151'
        },
        text: {
          primary: '#111827',   // Texto principal
          secondary: '#6b7280'  // Texto secundário
        },
        error: '#dc2626',    // Vermelho para erros
        success: '#059669'   // Verde para sucesso
      },
      spacing: {
        'sidebar': '200px'  // Largura fixa da sidebar
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [],
}