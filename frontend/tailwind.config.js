/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B3D6B',
          dark: '#062A4A',
          light: '#12518C',
        },
        saffron: {
          DEFAULT: '#FF9933',
          light: '#FFB05C',
        },
        green: {
          DEFAULT: '#138808',
          dark: '#0D6606',
        },
        gold: '#C9A227',
        paper: '#F5F4EF',
        ink: '#1A1A1A',
        muted: '#5B5B5B',
        hairline: '#E3E0D5',
      },
      fontFamily: {
        display: ['"Noto Serif"', '"Noto Serif Devanagari"', 'serif'],
        body: ['Inter', '"Noto Sans Devanagari"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(11,61,107,0.08), 0 1px 2px rgba(11,61,107,0.06)',
      },
    },
  },
  plugins: [],
}
