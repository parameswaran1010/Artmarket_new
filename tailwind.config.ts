import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:       "var(--background)",
        surface:          "var(--surface)",
        border:           "var(--border)",
        "text-primary":   "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        accent:           "var(--accent)",
        "accent-hover":   "var(--accent-hover)",
        success:          "var(--success)",
        error:            "var(--error)",
      },
    },
  },
  plugins: [],
};

export default config;
