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
          blue:         '#0c84a3', // teal primary — matches patient-app default button
          'blue-hover': '#0a6d87', // darkened teal for hover states
          green:        '#08c6aa', // teal-green accent
          orange:         '#f8931d', // CTA orange — matches patient-app .btn-orange
          'orange-hover': '#df7d0a', // darkened orange for hover states
        },
        soft: {
          blue:  '#ccecfa', // light teal focus tint
          green: '#E9F7EF',
        },
        dark: {
          charcoal: '#252830', // footer — matches patient-app footer bg
        },
        warning: {
          amber: '#F2C94C',
        },
        emergency: {
          red: '#EB5757',
        },
        // Urgency / status badge palette
        status: {
          'medium-bg':     '#fefce8', // yellow-50
          'medium-text':   '#854d0e', // yellow-800
          'medium-border': '#ca8a04', // yellow-600
          'high-bg':       '#fffbeb', // amber-50
          'high-text':     '#92400e', // amber-800
          'high-border':   '#d97706', // amber-600
          'error-bg':      '#fef2f2', // red-50
          'error-text':    '#991b1b', // red-800
          'error-border':  '#fca5a5', // red-300
        },
        // Surfaces
        'card-border': '#eef2f6', // card/list border — matches patient-app .root bg
        surface: {
          subtle: '#f7f9fa', // replaces bg-gray-50 / border-gray-100
        },
        background:   '#F9FBFD',
        'text-primary': '#1F2937',
        'text-muted':   '#6B7280',
        'brand-border': '#c0ccd1', // input/form border
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['16px', { lineHeight: '1.5' }],
      },
      boxShadow: {
        card: '0 4px 10px rgba(67, 95, 113, 0.08)', // matches patient-app card elevation
      },
    },
  },
  plugins: [],
}

export default config
