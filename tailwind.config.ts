import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        quiz: {
          bg: '#0A0E1A',
          card: '#111827',
          hover: '#1F2A42',
          border: '#1E293B',
          teal: '#0D9488',
          'teal-light': '#14B8A6',
          gold: '#F59E0B',
          'gold-light': '#FCD34D',
          purple: '#8B5CF6',
          pink: '#EC4899',
          green: '#10B981',
          text: '#F1F5F9',
          'text-secondary': '#94A3B8',
          'text-dim': '#64748B'
        }
      },
      boxShadow: {
        teal: '0 0 20px rgba(13, 148, 136, 0.25)',
        gold: '0 0 20px rgba(245, 158, 11, 0.25)',
        focus: '0 0 0 2px rgba(20, 184, 166, 0.35)'
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #14B8A6, #FCD34D)',
        'step-1-gradient': 'linear-gradient(90deg, #F59E0B, #EC4899)',
        'step-2-gradient': 'linear-gradient(90deg, #0D9488, #8B5CF6)',
        'step-3-gradient': 'linear-gradient(90deg, #8B5CF6, #EC4899)'
      },
      animation: {
        spin: 'spin 1s linear infinite',
        pulseSlow: 'pulse 2.5s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
