/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // ─────────────────────────────────────────────────────────────────────
      // Brand palette.
      //
      // primary/secondary previously resolved to #02A1FD (bright blue) and
      // #FFFFFF — a coherent blue-and-white theme that predates the current
      // brand and is now used by ~10 pages (/signin, /signup, /forgot-password,
      // /reset-password, /kura, /cart, /checkout, /orders, /status, ...).
      //
      // The design system mandates sage #ABD49E on charcoal #151413. Because
      // every usage pairs bg-primary with text-secondary (and inverts on
      // hover), flipping BOTH values re-skins those pages coherently:
      //   bg-primary  text-secondary  ->  sage bg,  charcoal text  (~10:1)
      //   bg-secondary text-primary   ->  charcoal bg, sage text   (~9:1)
      // Flipping only one would leave white-on-sage (~1.6:1) and fail contrast.
      //
      // This is one commit and reverts cleanly: git revert HEAD
      // ─────────────────────────────────────────────────────────────────────
      colors: {
        primary: "#ABD49E",
        secondary: "#151413",
        // Semantic aliases — prefer these in new code over primary/secondary.
        jungle: {
          sage: "#ABD49E",
          charcoal: "#151413",
        },
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
