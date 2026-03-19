import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    fontFamily: {
      mono: [
        '"JetBrains Mono"',
        '"Fira Code"',
        '"Cascadia Code"',
        "Menlo",
        "Consolas",
        "monospace",
      ],
      sans: [
        '"Inter"',
        '"Segoe UI"',
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ],
    },
    extend: {
      colors: {
        terminal: {
          bg: "#0d1117",
          surface: "#161b22",
          border: "#30363d",
          text: "#e6edf3",
          muted: "#7d8590",
          green: "#3fb950",
          red: "#f85149",
          yellow: "#d29922",
          blue: "#58a6ff",
          purple: "#bc8cff",
          cyan: "#76e3ea",
          orange: "#f0883e",
          pink: "#f778ba",
          prompt: "#3fb950",
          cursor: "#58a6ff",
          selection: "#264f78",
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        "fade-in": "fadeIn 0.15s ease-in",
        "slide-up": "slideUp 0.2s ease-out",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
