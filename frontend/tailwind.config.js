/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
      },
      boxShadow: {
        'elegant': 'var(--shadow-lg)',
        'soft': 'var(--shadow-soft)',
        'subtle': 'var(--shadow-sm)',
      },
      colors: {
        // Apple Style Colors
        'apple-blue': '#007AFF',
        'apple-purple': '#5856D6',
        'apple-green': '#34C759',
        'apple-orange': '#FF9500',
        'apple-red': '#FF3B30',
        'apple-gray': {
          50: '#FAFAFA',
          100: '#F5F5F7',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827'
        },
        
        // Original shadcn colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#007AFF',
          foreground: '#FFFFFF',
          light: '#4DA3FF',
          dark: '#0056CC'
        },
        secondary: {
          DEFAULT: '#5856D6',
          foreground: '#FFFFFF'
        },
        destructive: {
          DEFAULT: '#FF3B30',
          foreground: '#FFFFFF'
        },
        warning: {
          DEFAULT: '#FF9500',
          foreground: '#FFFFFF'
        },
        success: {
          DEFAULT: '#34C759',
          foreground: '#FFFFFF'
        },
        muted: {
          DEFAULT: '#F5F5F7',
          foreground: '#6B7280'
        },
        accent: {
          DEFAULT: '#F5F5F7',
          foreground: '#374151'
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#374151'
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#374151'
        },
        sidebar: {
          DEFAULT: 'rgba(255, 255, 255, 0.8)',
          foreground: '#374151',
          primary: '#007AFF',
          'primary-foreground': '#FFFFFF',
          accent: '#F5F5F7',
          'accent-foreground': '#374151',
          border: 'rgba(0, 0, 0, 0.06)',
          ring: '#007AFF'
        }
      },
      borderRadius: {
        'apple-sm': '6px',
        'apple-md': '12px',
        'apple-lg': '16px',
        'apple-xl': '24px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      spacing: {
        'sidebar': '280px',
        '18': '4.5rem',
        '22': '5.5rem'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace']
      },
      boxShadow: {
        'apple-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'apple-md': '0 4px 8px rgba(0, 0, 0, 0.04), 0 0 2px rgba(0, 0, 0, 0.06)',
        'apple-lg': '0 8px 16px rgba(0, 0, 0, 0.04), 0 0 4px rgba(0, 0, 0, 0.08)',
        'apple-xl': '0 16px 32px rgba(0, 0, 0, 0.06), 0 0 8px rgba(0, 0, 0, 0.10)',
        'elegant': 'var(--shadow-lg)',
        'soft': 'var(--shadow-soft)',
        'subtle': 'var(--shadow-sm)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out'
      }
    }
  },
  plugins: [],
}