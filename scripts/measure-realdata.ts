import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { performance } from "node:perf_hooks";
import { analyzeSensorInput } from "../src/features/sensors/importer";

interface FixtureMetric {
  fixture: string;
  readings: number;
  confidence: number;
  durationMs: number;
  anomalies: number;
  skippedRows: number;
}

const fixtureDir = join(process.cwd(), "test/fixtures/realdata");
const outputDir = join(process.cwd(), "docs/perf");
const fixtureFiles = readdirSync(fixtureDir)
  .filter((file) => !file.endsWith(".expected.json"))
  .sort();

const fixtureMetrics: FixtureMetric[] = fixtureFiles.map((file) => {
  const start = performance.now();
  const result = analyzeSensorInput(readFileSync(join(fixtureDir, file), "utf8"), {
    sourceName: file,
    sourceId: file.slice(0, 3),
  });

  return {
    fixture: basename(file),
    readings: result.readings.length,
    confidence: result.summary.confidence,
    durationMs: round(performance.now() - start),
    anomalies: result.summary.anomalies.length,
    skippedRows: result.summary.skippedRows.length,
  };
});

const hugeRows = ["Time (s),Acceleration x (m/s²)"];

for (let index = 0; index < 100_000; index += 1) {
  hugeRows.push(`${(index / 100).toFixed(2)},${Math.sin(index / 200).toFixed(5)}`);
}

const hugeStart = performance.now();
const huge = analyzeSensorInput(hugeRows.join("\n"), {
  sourceName: "synthetic 100k phone sensor companion",
  sourceId: "R08_huge",
});
const hugeDurationMs = round(performance.now() - hugeStart);
const durations = fixtureMetrics.map((metric) => metric.durationMs).sort((a, b) => a - b);
const report = {
  generatedAt: new Date().toISOString(),
  fixtureCount: fixtureMetrics.length,
  passRate: fixtureMetrics.filter((metric) => metric.readings > 0).length / fixtureMetrics.length,
  medianMs: percentile(durations, 0.5),
  p95Ms: percentile(durations, 0.95),
  worstMs: durations[durations.length - 1],
  huge100k: {
    readings: huge.readings.length,
    confidence: huge.summary.confidence,
    durationMs: hugeDurationMs,
    targetMs: 2000,
    passesTarget: hugeDurationMs < 2000,
  },
  fixtures: fixtureMetrics,
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, "phase2-import.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

function percentile(values: number[], ratio: number): number {
  if (values.length === 0) {
    return 0;
  }

  return values[Math.min(values.length - 1, Math.floor(values.length * ratio))];
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
