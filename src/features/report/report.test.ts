import { describe, expect, it } from "vitest";
import { renderSensorFigure } from "../analysis/figure";
import { computeSummaryStats } from "../analysis/stats";
import { createSampleReadings } from "../sensors/csv";
import { buildConclusion, buildReportSections, renderReportHtml } from "./report";
import { createExperiment } from "../../types";
import type { SummaryStats } from "../analysis/stats";

function statsWith(overrides: Partial<SummaryStats>): SummaryStats {
  return {
    count: 10,
    min: 0,
    max: 1,
    mean: 0.5,
    median: 0.5,
    standardDeviation: 0.1,
    slope: 1,
    intercept: 0,
    rSquared: 0.9,
    ...overrides,
  };
}

describe("report generation", () => {
  it("builds a formatted report with stats and figure", () => {
    const experiment = { ...createExperiment(), sensorReadings: createSampleReadings() };
    const stats = computeSummaryStats(experiment.sensorReadings);
    const figureSvg = renderSensorFigure(experiment.sensorReadings, experiment.title);
    const sections = buildReportSections({ experiment, stats, figureSvg });
    const html = renderReportHtml(
      { experiment, stats, figureSvg },
      { generatedAt: "2026-05-09T00:00:00.000Z", appVersion: "0.2.0-test" },
    );
    const htmlAgain = renderReportHtml(
      { experiment, stats, figureSvg },
      { generatedAt: "2026-05-09T00:00:00.000Z", appVersion: "0.2.0-test" },
    );

    expect(sections.map((section) => section.title)).toContain("Results");
    expect(sections.map((section) => section.title)).toContain("Data Quality");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Figure 1");
    expect(html).toContain("citizen-lab-provenance");
    expect(html).toBe(htmlAgain);
  });
});

describe("buildConclusion", () => {
  it("asks for more data when slope cannot be estimated", () => {
    const text = buildConclusion(statsWith({ slope: null, rSquared: null }), "temperature");
    expect(text).toMatch(/collect more measurements/i);
  });

  it("flags small samples even when a slope was fit", () => {
    const text = buildConclusion(statsWith({ count: 3 }), "temperature");
    expect(text).toMatch(/too few/i);
    expect(text).toMatch(/3 readings/i);
  });

  it("reports a strong positive relationship when R² is high and slope > 0", () => {
    const text = buildConclusion(statsWith({ slope: 1.2, rSquared: 0.85 }), "temperature");
    expect(text).toMatch(/strong/i);
    expect(text).toMatch(/increases/);
  });

  it("reports a strong negative relationship — does not collapse to 'no positive relationship'", () => {
    const text = buildConclusion(statsWith({ slope: -0.8, rSquared: 0.82 }), "temperature");
    expect(text).toMatch(/strong/i);
    expect(text).toMatch(/decreases/);
    expect(text).not.toMatch(/no positive relationship/i);
  });

  it("downgrades to moderate when fit is in the 0.3–0.7 band", () => {
    const text = buildConclusion(statsWith({ slope: 0.4, rSquared: 0.45 }), "ph");
    expect(text).toMatch(/moderate/i);
    expect(text).toMatch(/plausible/i);
  });

  it("calls a 0.1–0.3 fit a weak hint rather than a conclusion", () => {
    const text = buildConclusion(statsWith({ slope: 0.2, rSquared: 0.15 }), "ph");
    expect(text).toMatch(/weak/i);
    expect(text).toMatch(/hint/i);
  });

  it("refuses to claim a trend when R² is near zero", () => {
    const text = buildConclusion(statsWith({ slope: 0.05, rSquared: 0.02 }), "ph");
    expect(text).toMatch(/does not support a clear linear relationship/i);
  });

  it("falls back to a generic noun when no dependent variable is named", () => {
    const text = buildConclusion(statsWith({ slope: 1, rSquared: 0.9 }), "");
    expect(text).toMatch(/the measured value/);
  });
});
