/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        bg: {
          primary: "#0f172a",
          secondary: "#1e293b",
          tertiary: "#334155",
          card: "rgba(30, 41, 59, 0.7)",
        },
        brand: {
          primary: "#1e3a5f",
          accent: "#00d4ff",
          accentDim: "rgba(0, 212, 255, 0.15)",
        },
        success: {
          DEFAULT: "#10b981",
          dim: "rgba(16, 185, 129, 0.15)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          dim: "rgba(245, 158, 11, 0.15)",
        },
        danger: {
          DEFAULT: "#ef4444",
          dim: "rgba(239, 68, 68, 0.15)",
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#64748b",
        },
        border: {
          DEFAULT: "rgba(148, 163, 184, 0.15)",
          hover: "rgba(0, 212, 255, 0.4)",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 255, 0.15)",
        "glow-lg": "0 0 40px rgba(0, 212, 255, 0.25)",
        card: "0 4px 24px rgba(0, 0, 0, 0.3)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px)",
        "gradient-brand": "linear-gradient(135deg, #1e3a5f 0%, #00d4ff 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(30, 58, 95, 0.4) 0%, rgba(30, 41, 59, 0.8) 100%)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-border": "glow-border 2s ease-in-out infinite alternate",
      },
      keyframes: {
        "glow-border": {
          "0%": { boxShadow: "0 0 5px rgba(0, 212, 255, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
