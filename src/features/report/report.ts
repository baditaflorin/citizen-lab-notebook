import type { Experiment, ReportSection } from "../../types";
import { schemaVersion } from "../../types";
import type { SummaryStats } from "../analysis/stats";

export interface ReportInput {
  experiment: Experiment;
  stats: SummaryStats;
  figureSvg: string;
  aiDraft?: string;
}

export interface ReportRenderOptions {
  generatedAt?: string;
  appVersion?: string;
}

export function buildConclusion(stats: SummaryStats, dependentVariable: string): string {
  const variable = dependentVariable || "the measured value";

  if (stats.slope === null || stats.rSquared === null) {
    return "Collect more measurements before drawing a conclusion.";
  }

  if (stats.count < 5) {
    return `Only ${stats.count} reading${stats.count === 1 ? "" : "s"} were recorded — too few to draw a reliable conclusion about ${variable}. Aim for at least five trials before claiming a trend.`;
  }

  const direction =
    stats.slope > 0 ? "increases" : stats.slope < 0 ? "decreases" : "stays constant";
  const slopeMagnitude = Math.abs(stats.slope);
  const fit = stats.rSquared;

  // R² thresholds follow common citizen-science teaching: >=0.7 strong, >=0.3 moderate, >=0.1 weak, else inconclusive.
  if (fit >= 0.7) {
    return `The data show a strong linear relationship: ${variable} ${direction} by about ${slopeMagnitude} units per time step (R²=${fit}). The fit is consistent enough to support a real trend, though more trials would still tighten the estimate.`;
  }

  if (fit >= 0.3) {
    return `The data suggest ${variable} ${direction} with the time axis (slope ${stats.slope}, R²=${fit}), but the fit is moderate — the trend is plausible, not proven. Repeat the experiment to confirm.`;
  }

  if (fit >= 0.1) {
    return `A weak linear trend is visible (slope ${stats.slope}, R²=${fit}), but most of the variation in ${variable} is unexplained by time alone. Treat this as a hint rather than a conclusion.`;
  }

  return `The current evidence does not support a clear linear relationship between the time axis and ${variable} (R²=${fit}). The data are too scattered to claim a trend either way; consider whether a different model or another variable would explain the pattern.`;
}

function sentenceList(items: string[]): string {
  const filtered = items.map((item) => item.trim()).filter(Boolean);

  if (filtered.length === 0) {
    return "Not recorded yet.";
  }

  return filtered.join("; ");
}

export function buildReportSections(input: ReportInput): ReportSection[] {
  const { experiment, stats, aiDraft } = input;
  const observations = experiment.voiceNotes.map((note) => note.text);
  const metadata = experiment.imageMetadata.map(
    (image) => `${image.name}: ${Object.keys(image.fields).join(", ")}`,
  );
  const importSummary = experiment.sensorImportSummary;
  const quality =
    importSummary === null
      ? "No import summary is available for this dataset."
      : `Imported ${importSummary.importedCount} readings from ${importSummary.sourceName} as ${importSummary.sourceFormat} with ${importSummary.confidenceLabel} confidence. ${importSummary.skippedRows.length} row(s) were skipped and ${importSummary.anomalies.length} issue(s) were flagged.`;
  const trend =
    stats.slope === null
      ? "The dataset does not yet contain enough points to estimate a trend."
      : `The fitted trend changes by ${stats.slope} units per time step with R^2=${stats.rSquared}.`;

  return [
    {
      id: "abstract",
      title: "Abstract",
      body:
        aiDraft?.trim() ||
        `${experiment.title} investigates ${experiment.question.toLowerCase()} The current data include ${stats.count} sensor readings. ${trend}`,
    },
    {
      id: "hypothesis",
      title: "Hypothesis",
      body: experiment.hypothesis || "No hypothesis recorded yet.",
    },
    {
      id: "variables",
      title: "Variables",
      body: `Independent variable: ${experiment.independentVariable || "not recorded"}. Dependent variable: ${experiment.dependentVariable || "not recorded"}. Controls: ${experiment.controls || "not recorded"}.`,
    },
    {
      id: "materials",
      title: "Materials",
      body: experiment.materials || "No materials recorded yet.",
    },
    {
      id: "procedure",
      title: "Procedure",
      body: experiment.procedure || "No procedure recorded yet.",
    },
    {
      id: "observations",
      title: "Narrated Observations",
      body: sentenceList(observations),
    },
    {
      id: "results",
      title: "Results",
      body: `Count=${stats.count}, mean=${stats.mean ?? "n/a"}, median=${stats.median ?? "n/a"}, standard deviation=${stats.standardDeviation ?? "n/a"}, min=${stats.min ?? "n/a"}, max=${stats.max ?? "n/a"}. ${trend}`,
    },
    {
      id: "quality",
      title: "Data Quality",
      body: quality,
    },
    {
      id: "metadata",
      title: "Image Metadata",
      body: sentenceList(metadata),
    },
    {
      id: "safety",
      title: "Safety Notes",
      body: experiment.safetyNotes || "No safety notes recorded yet.",
    },
    {
      id: "conclusion",
      title: "Conclusion",
      body: buildConclusion(stats, experiment.dependentVariable),
    },
  ];
}

export function renderReportHtml(input: ReportInput, options: ReportRenderOptions = {}): string {
  const sections = buildReportSections(input);
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const provenance = {
    app: "Citizen Lab Notebook",
    appVersion: options.appVersion ?? "0.2.0",
    schemaVersion,
    generatedAt,
    experimentId: input.experiment.id,
    sensorImportSummary: input.experiment.sensorImportSummary,
  };
  const provenanceJson = JSON.stringify(provenance).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.experiment.title)} Lab Report</title>
  <style>
    body { font-family: ui-serif, Georgia, serif; color: #17211b; line-height: 1.55; margin: 48px auto; max-width: 880px; padding: 0 24px; }
    h1 { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 40px; line-height: 1; margin-bottom: 8px; }
    h2 { font-family: ui-sans-serif, system-ui, sans-serif; border-bottom: 1px solid #cdd5c8; padding-bottom: 6px; margin-top: 32px; }
    .meta { color: #526056; font-family: ui-sans-serif, system-ui, sans-serif; }
    figure { margin: 28px 0; }
    figure svg { width: 100%; height: auto; border: 1px solid #d8ded4; border-radius: 8px; }
    @media print { body { margin: 0.5in auto; } a { color: inherit; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(input.experiment.title)}</h1>
  <p class="meta">Generated ${escapeHtml(generatedAt)} by Citizen Lab Notebook v${escapeHtml(provenance.appVersion)}</p>
  <figure>
    ${input.figureSvg}
    <figcaption>Figure 1. Sensor readings captured or imported during the experiment.</figcaption>
  </figure>
  ${sections
    .map(
      (section) => `<section>
    <h2>${escapeHtml(section.title)}</h2>
    <p>${escapeHtml(section.body)}</p>
  </section>`,
    )
    .join("\n")}
  <script type="application/json" id="citizen-lab-provenance">${provenanceJson}</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
