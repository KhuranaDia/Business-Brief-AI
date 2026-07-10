/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#C8102E",
        "brand-dark": "#9E0C24",
        "dark-bg": "#0F0F1A",
        "card-bg": "#1A1A2E",
        "card-border": "#2A2A45",
      },
      keyframes: {
        "pulse-border": {
          "0%, 100%": { borderColor: "rgba(200, 16, 46, 0.4)" },
          "50%": { borderColor: "rgba(200, 16, 46, 1)" },
        },
      },
      animation: {
        "pulse-border": "pulse-border 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
