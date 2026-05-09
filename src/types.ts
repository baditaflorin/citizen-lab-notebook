import { z } from "zod";

export const schemaVersion = 1;

export const sensorReadingSchema = z.object({
  id: z.string(),
  time: z.number().finite(),
  value: z.number().finite(),
  unit: z.string().default(""),
  label: z.string().default("sensor"),
});

export const inferredFieldSchema = z.object({
  index: z.number(),
  name: z.string(),
  type: z.enum(["time", "timestamp", "value", "unit", "label", "metadata"]),
  unit: z.string().optional(),
  confidence: z.number(),
  reasons: z.array(z.string()),
});

export const skippedRowSchema = z.object({
  lineNumber: z.number(),
  raw: z.string(),
  reason: z.string(),
});

export const dataAnomalySchema = z.object({
  type: z.enum([
    "missing-value",
    "duplicate-time",
    "outlier",
    "formula-risk",
    "partial-row",
    "mixed-schema",
  ]),
  severity: z.enum(["info", "warning", "danger"]),
  message: z.string(),
  lineNumber: z.number().optional(),
  readingId: z.string().optional(),
});

export const sensorImportSummarySchema = z.object({
  sourceId: z.string(),
  sourceName: z.string(),
  sourceFormat: z.enum([
    "empty",
    "tabular-csv",
    "metadata-preamble-csv",
    "timestamped-logger-csv",
    "arduino-serial-log",
    "partial-single-column",
  ]),
  delimiter: z.string(),
  decimalSeparator: z.enum([".", ","]),
  headerRow: z.number().nullable(),
  rowCount: z.number(),
  importedCount: z.number(),
  skippedRows: z.array(skippedRowSchema),
  anomalies: z.array(dataAnomalySchema),
  fields: z.array(inferredFieldSchema),
  confidence: z.number(),
  confidenceLabel: z.enum(["high", "medium", "low"]),
  reasons: z.array(z.string()),
  durationMs: z.number(),
});

export const voiceNoteSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  source: z.enum(["speech-recognition", "whisper", "manual"]),
  text: z.string(),
});

export const imageMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  previewUrl: z.string().optional(),
  fields: z.record(z.string(), z.string()),
});

export const reportSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
});

export const activityEventSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  type: z.enum(["created", "sensor-imported", "report-exported", "notebook-imported"]),
  summary: z.string(),
});

export const experimentSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: z.string(),
  title: z.string(),
  question: z.string(),
  hypothesis: z.string(),
  independentVariable: z.string(),
  dependentVariable: z.string(),
  controls: z.string(),
  materials: z.string(),
  procedure: z.string(),
  safetyNotes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sensorReadings: z.array(sensorReadingSchema),
  sensorImportSummary: sensorImportSummarySchema.nullable().default(null),
  voiceNotes: z.array(voiceNoteSchema),
  imageMetadata: z.array(imageMetadataSchema),
  reportSections: z.array(reportSectionSchema),
  activityLog: z.array(activityEventSchema).default([]),
});

export type SensorReading = z.infer<typeof sensorReadingSchema>;
export type SensorImportSummary = z.infer<typeof sensorImportSummarySchema>;
export type VoiceNote = z.infer<typeof voiceNoteSchema>;
export type ImageMetadata = z.infer<typeof imageMetadataSchema>;
export type ReportSection = z.infer<typeof reportSectionSchema>;
export type ActivityEvent = z.infer<typeof activityEventSchema>;
export type Experiment = z.infer<typeof experimentSchema>;

export function createId(prefix: string): string {
  const cryptoId =
    globalThis.crypto && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${cryptoId}`;
}

export function createExperiment(): Experiment {
  const now = new Date().toISOString();

  return {
    schemaVersion,
    id: createId("exp"),
    title: "Yeast respiration temperature test",
    question: "How does water temperature affect yeast respiration rate?",
    hypothesis:
      "If the water temperature increases from room temperature to warm water, then yeast will produce carbon dioxide faster until the temperature becomes stressful.",
    independentVariable: "Water temperature",
    dependentVariable: "Foam height over time",
    controls: "Same yeast mass, sugar mass, bottle size, and observation interval",
    materials: "Active dry yeast, sugar, water, thermometer, bottle, ruler, timer",
    procedure:
      "Prepare yeast and sugar mixtures at each temperature, record foam height every minute, and compare the rate of change.",
    safetyNotes: "Use warm, not boiling, water and clean spills promptly.",
    createdAt: now,
    updatedAt: now,
    sensorReadings: [],
    sensorImportSummary: null,
    voiceNotes: [],
    imageMetadata: [],
    reportSections: [],
    activityLog: [
      {
        id: createId("activity"),
        createdAt: now,
        type: "created",
        summary: "Notebook created.",
      },
    ],
  };
}

export function touchExperiment(experiment: Experiment): Experiment {
  return { ...experiment, updatedAt: new Date().toISOString() };
}
