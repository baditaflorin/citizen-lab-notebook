import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8"),
) as { version: string };

export default defineConfig({
  base: "/citizen-lab-notebook/",
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION ?? packageJson.version),
    __GIT_COMMIT__: JSON.stringify(process.env.VITE_GIT_COMMIT ?? "main"),
    __REPOSITORY_URL__: JSON.stringify(
      process.env.VITE_REPOSITORY_URL ?? "https://github.com/baditaflorin/citizen-lab-notebook",
    ),
    __PAYPAL_URL__: JSON.stringify(
      process.env.VITE_PAYPAL_URL ?? "https://www.paypal.com/paypalme/florinbadita",
    ),
  },
  build: {
    outDir: "docs",
    emptyOutDir: false,
    sourcemap: false,
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@huggingface/transformers") || id.includes("onnxruntime-web")) {
            return "local-ai";
          }
        },
      },
    },
  },
  worker: {
    format: "es",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    exclude: ["node_modules/**", "docs/**", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/types.ts",
        "src/features/analysis/stats.ts",
        "src/features/analysis/figure.ts",
        "src/features/sensors/importer.ts",
        "src/features/sensors/csv.ts",
        "src/features/report/report.ts",
      ],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "src/**/*.d.ts"],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
});
