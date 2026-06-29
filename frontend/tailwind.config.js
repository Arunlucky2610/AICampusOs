export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6C4CF1",
        secondary: "#3B82F6",
        ink: "#111827",
        muted: "#6B7280",
        line: "#E5E7EB",
        soft: "#F8FAFC"
      },
      boxShadow: { premium: "0 24px 80px rgba(17,24,39,.10)" }
    }
  },
  plugins: []
};
