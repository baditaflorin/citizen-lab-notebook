import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8"),
) as { version: string };

function gitCommit(): string {
  if (process.env.VITE_GIT_COMMIT) {
    return process.env.VITE_GIT_COMMIT;
  }

  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

export default defineConfig({
  base: "/citizen-lab-notebook/",
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION ?? packageJson.version),
    __GIT_COMMIT__: JSON.stringify(gitCommit()),
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
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react";
          }

          if (id.includes("@huggingface/transformers")) {
            return "local-ai";
          }

          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/features/**", "src/lib/**"],
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
