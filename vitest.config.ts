import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: false,
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react"
  },
  test: {
    include: ["apps/**/*.test.ts", "apps/**/*.test.tsx", "packages/**/*.test.ts"],
    setupFiles: ["./tests/setup/load-test-env.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["apps/**/{_lib,lib}/**/*.ts"],
      exclude: ["**/*.d.ts", "**/.next/**", "**/dist/**", "**/*.test.ts", "**/*.test.tsx"],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70
      }
    }
  }
});
