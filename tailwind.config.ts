import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* === Backgrounds — Official Brandbook === */
        'bg-primary': '#050A12',
        'bg-secondary': '#090F1A',
        'bg-dark': '#03070D',
        'surface-1': '#0E1219',
        'surface-2': '#141822',
        'surface-3': '#1A1F2C',

        /* === Wireframe design system tokens === */
        'ink-900': '#11121A',
        'ink-800': '#1A1C22',
        'ink-700': '#2A2D35',
        'ink-500': '#555863',
        'volt-600': '#5B3DF5',
        'volt-400': '#8A73FF',
        'hot': '#FF3D6E',
        'lime-ok': '#1F8A5B',

        /* === Brand Primary — Violeta Elétrico === */
        'ec-violet': '#6C4DFF',
        'ec-violet-2': '#5637F5',

        /* === Accents (secondary) === */
        'accent-lime': '#B7FF3C',
        'accent-sky': '#5DDCFF',
        'accent-purple': '#8B5CF6',
        'accent-purple-light': '#C4B5FD',

        /* === Semantic === */
        'accent-green': '#22C55E',
        'accent-red': '#FF3B3B',
        'accent-yellow': '#FACC15',
        'accent-orange': '#F97316',

        /* === Text — Official === */
        'text-primary': '#FFFFFF',
        'text-secondary': '#9CA3AF',
        'text-muted': '#5F6573',
        'text-disabled': '#3D4455',

        /* === Snow / Light === */
        'ec-snow': '#F7F8FA',
        'ec-gray-100': '#EEF0F4',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter Tight', 'Inter', 'sans-serif'],
        'body-md': ['Inter Tight', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['64px', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['56px', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading-1': ['40px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'heading-2': ['32px', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '600' }],
        'heading-3': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        h1: ['40px', { lineHeight: '1.12', letterSpacing: '-0.01em', fontWeight: '800' }],
        h2: ['32px', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '750' }],
        h3: ['24px', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'ui-label': ['12px', { lineHeight: '1', letterSpacing: '0.08em', fontWeight: '600' }],
        'ui-label-lg': ['14px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '600' }],
        'code-data': ['12px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '700' }],
        micro: ['10px', { lineHeight: '1', letterSpacing: '0.12em', fontWeight: '700' }],
      },
      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '20px',
        'space-6': '24px',
        'space-8': '32px',
        'space-10': '40px',
        'space-12': '48px',
        'space-16': '64px',
      },
      borderRadius: {
        xs: '6px',
        sm: '12px',
        md: '20px',
        lg: '28px',
        xl: '36px',
        card: '20px',
        shell: '28px',
        btn: '12px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.40)',
        nav: '0 -1px 0 rgba(255,255,255,0.06), 0 -8px 32px rgba(0,0,0,0.50)',
        glass: '0 24px 80px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.10)',
        panel: '0 18px 60px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glow-violet': '0 0 40px rgba(91, 75, 255, 0.10)',
        'glow-lime': '0 0 40px rgba(183,255,60,0.06)',
        'glow-sky': '0 0 40px rgba(93,220,255,0.06)',
        'glow-purple': '0 0 40px rgba(139,92,246,0.06)',
      },
      borderColor: {
        subtle: 'rgba(255,255,255,0.07)',
        medium: 'rgba(255,255,255,0.12)',
        strong: 'rgba(255,255,255,0.20)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
