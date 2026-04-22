import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coal: "#10151B",
        cloud: "#F7F7F2",
        pulse: "#0A7C6B",
        signal: "#FF6B35",
        calm: "#DCE8E5"
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui"],
        display: ["'Sora'", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
} satisfies Config;

