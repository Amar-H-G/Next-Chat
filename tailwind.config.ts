import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        "bg-primary": "#0f0f1a",
        "bg-secondary": "#1a1a2e",
        "bg-surface": "#16213e",
        "bg-elevated": "#1e2a45",
        "accent-primary": "#6c63ff",
        "accent-secondary": "#a78bfa",
        "text-primary": "#e2e8f0",
        "text-secondary": "#94a3b8",
        "text-muted": "#64748b",
      },
    },
  },
  plugins: [],
};

export default config;
