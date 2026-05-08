import { rmSync } from "node:fs";

const generatedPaths = [
  "docs/assets",
  "docs/index.html",
  "docs/404.html",
  "docs/manifest.webmanifest",
  "docs/service-worker.js",
  "docs/icon.svg",
];

for (const path of generatedPaths) {
  rmSync(path, { recursive: true, force: true });
}
