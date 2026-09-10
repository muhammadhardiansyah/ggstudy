import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Segoe UI'", "Tahoma", "Geneva", "Verdana", "sans-serif"],
        mono: ["'Consolas'", "'Courier New'", "monospace"],
      },
      colors: {
        pastel: {
          cream: "#fdfbf7",
          sand: "#ffe8d6",
          latte: "#d4a373",
          terracotta: "#cc8b56",
          brown: "#a98467",
          tea: "#e9edc9",
          blush: "#f8edeb",
          coral: "#ffb5a7",
          cyan: "#e0f7fa",
          aqua: "#4dd0e1",
          teal: "#00acc1",
          deepTeal: "#00838f",
          mint: "#f0fdfa",
          seafoam: "#5eead4",
          codeBg: "#2b2d42",
        },
      },
    },
  },
  plugins: [],
};
export default config;
