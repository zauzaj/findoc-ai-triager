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
          blue: '#2F80ED',
          green: '#27AE60',
        },
        soft: {
          blue: '#E7F0FD',
          green: '#E9F7EF',
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['16px', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
}

export default config
