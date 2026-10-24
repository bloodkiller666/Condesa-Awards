import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Superficies: negro-violeta profundo (nunca negro puro).
        ink: {
          DEFAULT: "#07050b",
          2: "#0d0a15",
          3: "#14101f",
          4: "#1c1629",
          5: "#271f38"
        },
        // Texto: crema cálido tipo fósforo, no blanco puro.
        cream: {
          DEFAULT: "#f4ece1",
          2: "#d9d0e3"
        },
        line: {
          DEFAULT: "rgba(244, 236, 225, 0.1)",
          strong: "rgba(244, 236, 225, 0.2)"
        },
        mute: "#a59cb6",
        dim: "#6c6380",
        // Acento principal: magenta caliente.
        pink: {
          DEFAULT: "#ff4fa3",
          200: "#ffc2e0",
          300: "#ff9acd",
          400: "#ff6fb5",
          500: "#ff4fa3",
          600: "#e0338a",
          700: "#a3125f",
          800: "#5c0a36"
        },
        // Acentos de apoyo (uso puntual).
        gold: {
          DEFAULT: "#ffc857",
          dark: "#b8862a"
        },
        cyan: {
          DEFAULT: "#62e6ff"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "monospace"],
        mono: ["var(--font-mono-ui)", "ui-monospace", "monospace"],
        crt: ["var(--font-vt323)", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        "pink-glow": "0 0 24px -4px rgba(255, 79, 163, 0.45)",
        "pink-glow-lg":
          "0 0 40px -6px rgba(255, 79, 163, 0.55), 0 0 90px -20px rgba(255, 79, 163, 0.4)",
        "gold-glow": "0 0 32px -6px rgba(255, 200, 87, 0.5)",
        hard: "4px 4px 0 0 rgba(0, 0, 0, 0.55)"
      },
      keyframes: {
        flicker: {
          "0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%": { opacity: "1" },
          "20%, 21.999%, 63%, 63.999%, 65%, 69.999%": { opacity: "0.45" }
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" }
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" }
        }
      },
      animation: {
        flicker: "flicker 4s linear infinite",
        "pulse-glow": "pulse-glow 2.2s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        blink: "blink 1s steps(1, end) infinite"
      }
    }
  },
  plugins: []
};

export default config;
