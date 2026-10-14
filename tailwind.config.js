/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#02A1FD",
        secondary: "#FFFFFF",
        accent: {
          red: "#E9040C",
          yellow: "#FFF212",
        },
      },
      fontFamily: {
        code: ["CodeSaver", "monospace"],
        CodeSaver: ["CodeSaver", "monospace"],
        body: ["Inter", "sans-serif"],
        averia: ["Averia Sans Libre", "sans-serif"],
      },
      screens: {
        xs: "480px",
      },
      animation: {
        marquee: "slidurrr 35s linear infinite",
      },
      keyframes: {
        slidurrr: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
