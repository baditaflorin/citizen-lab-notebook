import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { analyzeSensorInput, canonicalImportResult } from "./importer";

interface ExpectedFixture {
  id: string;
  sourceFormat: string;
  delimiter: string;
  decimalSeparator?: "." | ",";
  minReadings: number;
  labels: string[];
  unit?: string;
  confidenceAtLeast: number;
  skippedAtMost?: number;
  skippedAtLeast?: number;
  anomaliesAtLeast: number;
}

const fixtureDir = join(process.cwd(), "test/fixtures/realdata");
const fixtureFiles = readdirSync(fixtureDir)
  .filter((file) => !file.endsWith(".expected.json"))
  .sort();

describe("real-data sensor import fixtures", () => {
  it.each(fixtureFiles)("%s imports with expected inferred shape", (file) => {
    const fixturePath = join(fixtureDir, file);
    const expectedPath = fixturePath.replace(/\.(csv|txt)$/u, ".expected.json");
    const expected = JSON.parse(readFileSync(expectedPath, "utf8")) as ExpectedFixture;
    const result = analyzeSensorInput(readFileSync(fixturePath, "utf8"), {
      sourceName: file,
      sourceId: expected.id,
    });
    const labels = new Set(result.readings.map((reading) => reading.label));

    expect(result.summary.sourceFormat, basename(file)).toBe(expected.sourceFormat);
    expect(result.summary.delimiter).toBe(expected.delimiter);
    expect(result.summary.decimalSeparator).toBe(expected.decimalSeparator ?? ".");
    expect(result.readings.length).toBeGreaterThanOrEqual(expected.minReadings);
    expect(result.summary.confidence).toBeGreaterThanOrEqual(expected.confidenceAtLeast);
    expect(result.summary.anomalies.length).toBeGreaterThanOrEqual(expected.anomaliesAtLeast);

    if (expected.skippedAtMost !== undefined) {
      expect(result.summary.skippedRows.length).toBeLessThanOrEqual(expected.skippedAtMost);
    }

    if (expected.skippedAtLeast !== undefined) {
      expect(result.summary.skippedRows.length).toBeGreaterThanOrEqual(expected.skippedAtLeast);
    }

    for (const label of expected.labels) {
      expect(labels.has(label), `${file} should include label ${label}`).toBe(true);
    }

    if (expected.unit) {
      expect(
        result.readings.some((reading) => reading.unit === expected.unit),
        `${file} should include unit ${expected.unit}`,
      ).toBe(true);
    }

    expect(canonicalImportResult(result)).toEqual(
      canonicalImportResult(
        analyzeSensorInput(readFileSync(fixturePath, "utf8"), {
          sourceName: file,
          sourceId: expected.id,
        }),
      ),
    );
  });

  it("parses a 100k-row phone sensor export within the substance budget", () => {
    const rows = ["Time (s),Acceleration x (m/s²)"];

    for (let index = 0; index < 100_000; index += 1) {
      rows.push(`${(index / 100).toFixed(2)},${Math.sin(index / 200).toFixed(5)}`);
    }

    const result = analyzeSensorInput(rows.join("\n"), {
      sourceName: "synthetic 100k phone sensor companion",
      sourceId: "R08_huge",
    });

    expect(result.readings).toHaveLength(100_000);
    // Coverage instrumentation adds overhead; the non-instrumented perf script enforces the 2s target.
    expect(result.summary.durationMs).toBeLessThan(5_000);
    expect(result.summary.confidence).toBeGreaterThanOrEqual(0.85);
  });
});
