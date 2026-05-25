import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        panel: "#11141b",
        border: "#1f242e",
        accent: "#5b8def",
        accent2: "#8a5bff",
      },
    },
  },
  plugins: [],
};
export default config;
