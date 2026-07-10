/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#080810",
          secondary: "#0F0F1A",
          card: "#12121F",
          border: "#1E1E3A",
        },
        brand: {
          red: "#E8173D",
          redHover: "#FF1F47",
        },
        text: {
          primary: "#F0F0FF",
          muted: "#6B7280",
          subtle: "#374151",
        },
        status: {
          critical: "#EF4444",
          warning: "#F59E0B",
          stable: "#10B981",
          good: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        pulse_slow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        fade_in: "fadeIn 0.5s ease-in-out",
        slide_up: "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
