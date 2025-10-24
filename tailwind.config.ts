import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Var Habitat Theme Colors - Using CSS variables
        'vh-blue': {
          light: 'var(--vh-blue-light)',
          DEFAULT: 'var(--vh-blue)',
          dark: 'var(--vh-blue-dark)',
        },
        'vh-purple': 'var(--vh-purple)',
        'vh-gray': {
          light: 'var(--vh-gray-light)',
          DEFAULT: 'var(--vh-gray)',
          dark: 'var(--vh-gray-dark)',
        },
        'vh-success': 'var(--vh-success)',
        'vh-warning': 'var(--vh-warning)',
        'vh-error': 'var(--vh-error)',
      },
    },
  },
  plugins: [],
}
export default config
