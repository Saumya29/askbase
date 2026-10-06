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
        display: ["var(--font-lora)", "Georgia", "serif"],
      },
      colors: {
        border: "hsl(140 10% 89%)",
        input: "hsl(140 14% 96%)",
        ring: "hsl(156 32% 42%)",
        background: "hsl(130 16% 97%)",
        foreground: "hsl(165 12% 16%)",
        muted: {
          DEFAULT: "hsl(135 14% 94%)",
          foreground: "hsl(155 8% 46%)",
        },
        primary: {
          DEFAULT: "hsl(160 53% 26%)",
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          DEFAULT: "hsl(130 12% 92%)",
          foreground: "hsl(165 12% 19%)",
        },
        accent: {
          DEFAULT: "hsl(138 17% 90%)",
          foreground: "hsl(165 12% 19%)",
        },
        destructive: {
          DEFAULT: "hsl(0 72% 51%)",
          foreground: "hsl(38 25% 97%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(165 12% 16%)",
        },
        surface: "hsl(135 14% 95%)",
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(165 12% 16%)",
        },
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgba(50, 35, 15, 0.10), 0 1px 3px -1px rgba(50, 35, 15, 0.06)",
        card: "0 4px 24px -4px rgba(50, 35, 15, 0.10), 0 1px 4px -1px rgba(50, 35, 15, 0.06)",
        demo: "0 24px 64px -12px rgba(50, 35, 15, 0.22), 0 8px 24px -4px rgba(50, 35, 15, 0.10)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
