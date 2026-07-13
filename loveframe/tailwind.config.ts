import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14142B",
        dusk: "#23234A",
        dusk2: "#2E2E5C",
        gold: "#F2B85C",
        rose: "#E99A9A",
        paper: "#FAF3E7",
        teal: "#57C7B8",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-manrope)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      backgroundImage: {
        "night-sky":
          "radial-gradient(circle at 20% 20%, rgba(242,184,92,0.08), transparent 40%), radial-gradient(circle at 80% 0%, rgba(87,199,184,0.10), transparent 45%), linear-gradient(180deg, #14142B 0%, #1B1B3D 55%, #23234A 100%)",
      },
      keyframes: {
        pulseLine: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        drift: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
          "100%": { transform: "translateY(0px)" },
        },
      },
      animation: {
        pulseLine: "pulseLine 2.2s ease-in-out infinite",
        drift: "drift 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
