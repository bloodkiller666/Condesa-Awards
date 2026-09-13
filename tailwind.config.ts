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
        // Minimalist retro / CRT terminal — black, white, pink
        terminal: {
          black: "#050505",
          panel: "#0a0a0a"
        },
        pink: {
          DEFAULT: "#ec4899",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777"
        }
      },
      fontFamily: {
        pixel: ["var(--font-press-start)", "monospace"],
        retro: ["var(--font-chakra)", "monospace"],
        crt: ["var(--font-vt323)", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        "pink-glow": "0 0 15px rgba(236, 72, 153, 0.5)",
        "pink-glow-lg":
          "0 0 25px rgba(236, 72, 153, 0.6), 0 0 60px rgba(236, 72, 153, 0.3)",
        "pink-inset": "inset 0 0 12px rgba(236, 72, 153, 0.25)"
      },
      keyframes: {
        flicker: {
          "0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%": { opacity: "1" },
          "20%, 21.999%, 63%, 63.999%, 65%, 69.999%": { opacity: "0.33" }
        },
        "scanline-move": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" }
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" }
        },
        "glitch-flicker": {
          "0%": { opacity: "0", transform: "translateX(-4px) skewX(0deg)", textShadow: "0 0 0 transparent" },
          "10%": { opacity: "1", transform: "translateX(4px) skewX(-8deg)", textShadow: "0 0 8px #f472b6, 0 0 22px #ec4899" },
          "20%": { opacity: "0.2", transform: "translateX(-3px) skewX(0deg)" },
          "30%": { opacity: "1", transform: "translateX(2px) skewX(6deg)", textShadow: "0 0 8px #f472b6, 0 0 30px rgba(236,72,153,0.7)" },
          "45%": { opacity: "0.4", transform: "translateX(-2px) skewX(0deg)" },
          "60%": { opacity: "1", transform: "translateX(0) skewX(0deg)", textShadow: "0 0 8px #f472b6, 0 0 22px #ec4899, 0 0 50px rgba(236,72,153,0.6)" },
          "75%": { opacity: "0.7", transform: "translateX(1px) skewX(0deg)" },
          "100%": { opacity: "1", transform: "translateX(0) skewX(0deg)", textShadow: "0 0 8px #f472b6, 0 0 22px #ec4899, 0 0 50px rgba(236,72,153,0.6), 0 0 90px rgba(236,72,153,0.4)" }
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        flicker: "flicker 4s linear infinite",
        "scanline-move": "scanline-move 8s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "glitch-flicker": "glitch-flicker 0.7s steps(1, end) 1 both",
        "fade-in-up": "fade-in-up 0.5s ease-out both"
      }
    }
  },
  plugins: []
};

export default config;