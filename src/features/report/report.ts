import type { Experiment, ReportSection } from "../../types";
import type { SummaryStats } from "../analysis/stats";

export interface ReportInput {
  experiment: Experiment;
  stats: SummaryStats;
  figureSvg: string;
  aiDraft?: string;
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
      body:
        stats.slope === null
          ? "Collect more measurements before drawing a conclusion."
          : `The current evidence ${stats.slope > 0 ? "supports a positive relationship" : "does not show a positive relationship"} between the recorded time axis and ${experiment.dependentVariable || "the measured value"}. More trials would improve confidence.`,
    },
  ];
}

export function renderReportHtml(input: ReportInput): string {
  const sections = buildReportSections(input);
  const generatedAt = new Date().toLocaleString();

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
  <p class="meta">Generated ${escapeHtml(generatedAt)} by Citizen Lab Notebook</p>
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
