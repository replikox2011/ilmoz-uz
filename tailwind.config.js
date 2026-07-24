/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Nexo palette — deep space dark base, white surfaces, blue accents
        bg: {
          DEFAULT: "#05060a",
          soft: "#0a0c14",
          elevated: "#0f1220",
        },
        brand: {
          50: "#eff5ff",
          100: "#dbe8ff",
          200: "#bfd6ff",
          300: "#93b8ff",
          400: "#5f90ff",
          500: "#3b6bff",
          600: "#2450f5",
          700: "#1c3ddb",
          800: "#1d34b0",
          900: "#1e328b",
        },
        glass: {
          border: "rgba(255,255,255,0.08)",
          highlight: "rgba(255,255,255,0.05)",
        },
      },
      fontFamily: {
        sans: [
          "Inter Tight",
          "Inter",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.45)",
        "glass-lg": "0 24px 64px rgba(0,0,0,0.55)",
        glow: "0 0 40px rgba(59,107,255,0.35)",
        "glow-sm": "0 0 20px rgba(59,107,255,0.25)",
        "glow-lg": "0 0 80px rgba(59,107,255,0.3)",
      },
      backdropBlur: {
        xs: "2px",
        "3xl": "48px",
        "4xl": "72px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(200%)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "rgba(255,255,255,0.08)" },
          "50%": { borderColor: "rgba(59,107,255,0.3)" },
        },
        "orb-drift": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.05)" },
          "66%": { transform: "translate(-20px, 15px) scale(0.95)" },
          "100%": { transform: "translate(0, 0) scale(1)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        "depth-float": {
          "0%, 100%": { transform: "translateY(0px) rotateX(0deg) rotateY(0deg)" },
          "33%": { transform: "translateY(-12px) rotateX(1.5deg) rotateY(-1deg)" },
          "66%": { transform: "translateY(-6px) rotateX(-0.5deg) rotateY(0.5deg)" },
        },
        "blob-morph": {
          "0%": { borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%" },
          "25%": { borderRadius: "70% 30% 50% 50% / 30% 30% 70% 70%" },
          "50%": { borderRadius: "50% 50% 30% 70% / 60% 40% 60% 40%" },
          "75%": { borderRadius: "30% 70% 60% 40% / 50% 60% 30% 60%" },
          "100%": { borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%" },
        },
        "bounce-scroll": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.6" },
          "50%": { transform: "translateY(8px)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 8s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "border-glow": "border-glow 4s ease-in-out infinite",
        "orb-drift": "orb-drift 20s ease-in-out infinite",
        "spin-slow": "spin 18s linear infinite",
        "depth-float": "depth-float 10s ease-in-out infinite",
        "blob-morph": "blob-morph 12s ease-in-out infinite",
        "bounce-scroll": "bounce-scroll 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/container-queries")],
};

