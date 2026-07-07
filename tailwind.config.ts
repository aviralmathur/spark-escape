import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "#0b1020",
        nightlight: "#161d3a",
        spark: "#ffd23f",
        sparkhot: "#ff8a1e",
      },
      keyframes: {
        bob: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        floatup: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-140px) rotate(360deg)", opacity: "0" },
        },
      },
      animation: {
        bob: "bob 2.4s ease-in-out infinite",
        pop: "pop 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
