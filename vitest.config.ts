import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: "react-jsx"
  },
  test: {
    include: ["apps/**/*.test.ts", "apps/**/*.test.tsx", "packages/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["apps/**/{_lib,lib}/**/*.ts"],
      exclude: ["**/*.d.ts", "**/.next/**", "**/dist/**", "**/*.test.ts", "**/*.test.tsx"]
    }
  }
});
