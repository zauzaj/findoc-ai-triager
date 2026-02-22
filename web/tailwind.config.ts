import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#0c84a3',    // teal — matches patient-app primary (#0c84a3 / #00a9b7)
          green: '#08c6aa',   // teal-green — matches patient-app accent green
          orange: '#f8931d',  // CTA orange — matches patient-app header/action buttons
        },
        soft: {
          blue: '#ccecfa',    // light teal focus tint — matches patient-app select focus
          green: '#E9F7EF',
        },
        dark: {
          charcoal: '#252830', // footer dark background — matches patient-app footer
        },
        warning: {
          amber: '#F2C94C',
        },
        emergency: {
          red: '#EB5757',
        },
        background: '#F9FBFD',
        'text-primary': '#1F2937',
        'text-muted': '#6B7280',
        'brand-border': '#c0ccd1', // border colour — matches patient-app inputs/cards
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'], // matches patient-app font
      },
      fontSize: {
        base: ['16px', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
}

export default config
