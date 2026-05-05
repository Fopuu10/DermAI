import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0D9488",
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        cream: "#FAFAF9",
        coral: {
          DEFAULT: "#F97316",
          100: "#FFEDD5",
          500: "#F97316",
          600: "#EA580C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontWeight: {
        "extrabold": "800",
      },
    },
  },
  plugins: [],
};
export default config;
