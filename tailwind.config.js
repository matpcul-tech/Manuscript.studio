/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: '#4f6df5',
          deep: '#3a52d4',
          soft: '#eef1ff',
          tint: '#f7f9ff',
        },
        ink: {
          DEFAULT: '#1c2030',
          2: '#424859',
          3: '#6b7280',
          4: '#9ca3af',
          5: '#d1d5db',
        },
        line: {
          DEFAULT: '#e9ecf2',
          2: '#f1f3f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
