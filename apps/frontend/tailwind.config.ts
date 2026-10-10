import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        sans: ["var(--font-sans)"],
      },
      colors: {
        canvas: "#0a0e14",
        surface: "#10151d",
        raised: "#161c26",
        line: "#232b38",
        pulse: "#2dd4bf",
        pulsedim: "#134e4a",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(45, 212, 191, 0.15), 0 0 24px rgba(45, 212, 191, 0.08)",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        pulsering: {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        scanline: "scanline 3s linear infinite",
        pulsering: "pulsering 1.8s ease-out infinite",
        rise: "rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards",
      },
    },
  },
  plugins: [],
};

export default config;
