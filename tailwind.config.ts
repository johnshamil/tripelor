
import type { Config } from "tailwindcss";
const config: Config = { content:["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}"], theme:{extend:{colors:{gold:"#D4AF37",ink:"#070707"},boxShadow:{gold:"0 10px 30px rgba(212,175,55,.18)"}}}, plugins:[] };
export default config;
