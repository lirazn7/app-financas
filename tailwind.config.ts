import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // ⬅️ AVISO PARA O TAILWIND AQUI
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // ... restante das suas configurações
  },
  plugins: [],
};
export default config;