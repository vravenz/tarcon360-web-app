/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        light: {
          background: '#f9fafb',
          text: '#111827',
          cardBackground: '#ffffff',
          buttonBackground: '#e2e8f0',
          buttonText: '#1a202c',
          border: '#e5e7eb',      
          hover: '#f3f4f6'
        },
        dark: {
          background: '#121212',
          text: '#a6a6a6',
          cardBackground: '#1e1e1e',
          buttonBackground: '#2a2a2a',
          buttonText: '#d1d5db',
          border: '#363636',    
          hover: '#121212'
        },
      },
    },
  },
  plugins: [],
};
