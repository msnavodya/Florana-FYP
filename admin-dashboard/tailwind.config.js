// Configure the admin dashboard build settings for Tailwind.Config.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f7effa',
          100: '#ead8f1',
          500: '#aa73c4',
          700: '#9b63bb',
          800: '#8d56af',
          900: '#6f3f8f',
        },
      },
      boxShadow: {
        soft: '0 12px 35px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
