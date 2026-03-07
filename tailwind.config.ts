import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(0 0% 90%)",
        input: "hsl(0 0% 98%)",
        ring: "hsl(0 0% 25%)",
        background: "hsl(0 0% 99%)",
        foreground: "hsl(0 0% 9%)",
        muted: "hsl(0 0% 96%)",
        mutedForeground: "hsl(0 0% 45%)",
        primary: "hsl(0 0% 9%)",
        primaryForeground: "hsl(0 0% 98%)",
        secondary: "hsl(0 0% 94%)",
        secondaryForeground: "hsl(0 0% 12%)",
        accent: "hsl(0 0% 92%)",
        accentForeground: "hsl(0 0% 12%)",
        destructive: "hsl(0 72% 51%)",
        destructiveForeground: "hsl(0 0% 98%)",
        card: "hsl(0 0% 100%)",
        cardForeground: "hsl(0 0% 10%)",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
