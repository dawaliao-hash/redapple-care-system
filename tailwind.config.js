/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Noto Serif TC"', 'serif'],
        body: ['"Noto Sans TC"', 'sans-serif'],
      },
      colors: {
        cream: '#FBF6EC',
        cranberry: '#A53838',
        sage: '#7A9474',
        amber: '#C68B4F',
      },
    },
  },
  plugins: [],
}
