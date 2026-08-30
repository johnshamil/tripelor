
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#C9A86A",
        ink: "#071922",
      },
      boxShadow: {
        gold: "0 16px 40px rgba(201,168,106,.18)",
      },
    },
  },
  plugins: [],
};

export default config;
