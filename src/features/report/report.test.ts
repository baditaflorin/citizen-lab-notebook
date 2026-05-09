import { describe, expect, it } from "vitest";
import { renderSensorFigure } from "../analysis/figure";
import { computeSummaryStats } from "../analysis/stats";
import { createSampleReadings } from "../sensors/csv";
import { buildReportSections, renderReportHtml } from "./report";
import { createExperiment } from "../../types";

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
