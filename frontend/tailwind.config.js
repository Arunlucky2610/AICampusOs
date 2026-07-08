export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6C4CF1",
        "primary-dark": "#5A3DD8",
        "primary-light": "#8B6FF7",
        secondary: "#3B82F6",
        ink: "#111827",
        muted: "#6B7280",
        line: "#E5E7EB",
        soft: "#F8FAFC",
        glass: "rgba(255,255,255,0.72)",
        "glass-border": "rgba(255,255,255,0.18)",
      },
      boxShadow: {
        premium: "0 24px 80px rgba(17,24,39,.10)",
        glass: "0 8px 32px rgba(108,76,241,0.08)",
        "glass-lg": "0 16px 48px rgba(108,76,241,0.12)",
        glow: "0 0 24px rgba(108,76,241,0.25)",
        "glow-lg": "0 0 40px rgba(108,76,241,0.35)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "slide-down": "slideDown 0.3s ease-out forwards",
        "scale-in": "scaleIn 0.3s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideDown: { "0%": { opacity: "0", transform: "translateY(-8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        pulseGlow: { "0%, 100%": { boxShadow: "0 0 12px rgba(108,76,241,0.15)" }, "50%": { boxShadow: "0 0 28px rgba(108,76,241,0.3)" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    }
  },
  plugins: []
};
