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
        border: "hsl(35 15% 87%)",
        input: "hsl(38 18% 97%)",
        ring: "hsl(30 10% 20%)",
        background: "hsl(38 25% 97%)",
        foreground: "hsl(25 12% 10%)",
        muted: {
          DEFAULT: "hsl(36 18% 93%)",
          foreground: "hsl(30 8% 46%)",
        },
        primary: {
          DEFAULT: "hsl(25 12% 10%)",
          foreground: "hsl(38 25% 97%)",
        },
        secondary: {
          DEFAULT: "hsl(36 15% 91%)",
          foreground: "hsl(25 12% 14%)",
        },
        accent: {
          DEFAULT: "hsl(35 18% 89%)",
          foreground: "hsl(25 12% 14%)",
        },
        destructive: {
          DEFAULT: "hsl(0 72% 51%)",
          foreground: "hsl(38 25% 97%)",
        },
        card: {
          DEFAULT: "hsl(40 30% 99%)",
          foreground: "hsl(25 12% 10%)",
        },
        surface: "hsl(37 22% 95%)",
        popover: {
          DEFAULT: "hsl(40 30% 99%)",
          foreground: "hsl(25 12% 10%)",
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
