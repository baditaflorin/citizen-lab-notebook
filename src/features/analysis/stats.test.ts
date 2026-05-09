import { describe, expect, it } from "vitest";
import type { SensorReading } from "../../types";
import { computeSummaryStats, linearRegression, selectPrimarySeries } from "./stats";

const readings: SensorReading[] = [
  { id: "1", time: 0, value: 1, unit: "cm", label: "height" },
  { id: "2", time: 1, value: 3, unit: "cm", label: "height" },
  { id: "3", time: 2, value: 5, unit: "cm", label: "height" },
];

describe("computeSummaryStats", () => {
  it("computes descriptive statistics and linear trend", () => {
    expect(computeSummaryStats(readings)).toMatchObject({
      count: 3,
      min: 1,
      max: 5,
      mean: 3,
      median: 3,
      standardDeviation: 2,
      slope: 2,
      intercept: 1,
      rSquared: 1,
    });
  });

  it("returns null fields for empty input", () => {
    expect(computeSummaryStats([])).toMatchObject({
      count: 0,
      mean: null,
      slope: null,
    });
  });
});

describe("linearRegression", () => {
  it("returns null when x does not vary", () => {
    expect(
      linearRegression([
        [2, 1],
        [2, 3],
      ]),
    ).toBeNull();
  });
});

describe("selectPrimarySeries", () => {
  it("keeps multi-channel analysis focused on one sensor channel", () => {
    const primary = selectPrimarySeries([
      { id: "1", time: 0, value: 20, unit: "C", label: "temperature" },
      { id: "2", time: 0, value: 100, unit: "", label: "light" },
      { id: "3", time: 1, value: 21, unit: "C", label: "temperature" },
    ]);

    expect(primary.label).toBe("temperature");
    expect(primary.readings).toHaveLength(2);
  });
});
