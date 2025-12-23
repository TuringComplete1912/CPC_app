import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/services/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', "sans-serif"]
      },
      colors: {
        brand: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          500: "#dc2626",
          600: "#b91c1c",
          900: "#7f1d1d"
        },
        accent: {
          400: "#fbbf24",
          500: "#f59e0b"
        },
        gray: {
          50: "#f9fafb",
          800: "#1f2937",
          900: "#111827"
        }
      }
    }
  },
  plugins: []
};

export default config;

