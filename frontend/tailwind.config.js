/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tema LÚCIO Dark - Moderno e Sofisticado
        background: {
          DEFAULT: '#0f0f23',
          secondary: '#1c1c1c',
          card: '#1a1a2e',
          hover: '#2d2d4a'
        },
        foreground: {
          DEFAULT: '#ffffff',
          muted: '#a1a1aa',
          secondary: '#d4d4d8'
        },
        primary: {
          DEFAULT: '#3b82f6',
          50: '#1e3a8a',
          100: '#1d4ed8',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          foreground: '#ffffff',
          hover: '#60a5fa'
        },
        secondary: {
          DEFAULT: '#27272a',
          foreground: '#ffffff'
        },
        accent: {
          DEFAULT: '#0ea5e9',
          foreground: '#ffffff'
        },
        muted: {
          DEFAULT: '#27272a',
          foreground: '#a1a1aa'
        },
        border: '#3f3f46',
        input: '#1a1a2e',
        ring: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        destructive: '#ef4444',
        // Gradientes modernos
        gradient: {
          from: '#0f0f23',
          to: '#1c1c1c'
        },
        // Cores LÚCIO Dark
        lucio: {
          blue: '#3b82f6',
          'blue-light': '#60a5fa',
          gray: '#1a1a2e',
          'gray-light': '#27272a'
        }
      },
      spacing: {
        'sidebar': '256px'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: [],
}