
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "rgb(var(--brand-accent-rgb) / <alpha-value>)",
        ink: "#222923",
      },
      boxShadow: {
        gold: "0 16px 40px rgba(48,73,223,.12)",
      },
    },
  },
  plugins: [],
};

export default config;
