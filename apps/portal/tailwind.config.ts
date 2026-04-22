import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212B",
        mist: "#F4F1EA",
        ember: "#C65D39",
        pine: "#1F4D45",
        gold: "#D4A24C"
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "ui-sans-serif", "system-ui"],
        serif: ["'Bricolage Grotesque'", "ui-serif", "Georgia"]
      }
    }
  },
  plugins: []
} satisfies Config;

