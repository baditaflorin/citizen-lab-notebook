import { z } from "zod";

export const schemaVersion = 1;

export const sensorReadingSchema = z.object({
  id: z.string(),
  time: z.number().finite(),
  value: z.number().finite(),
  unit: z.string().default(""),
  label: z.string().default("sensor"),
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
  voiceNotes: z.array(voiceNoteSchema),
  imageMetadata: z.array(imageMetadataSchema),
  reportSections: z.array(reportSectionSchema),
});

export type SensorReading = z.infer<typeof sensorReadingSchema>;
export type VoiceNote = z.infer<typeof voiceNoteSchema>;
export type ImageMetadata = z.infer<typeof imageMetadataSchema>;
export type ReportSection = z.infer<typeof reportSectionSchema>;
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
    voiceNotes: [],
    imageMetadata: [],
    reportSections: [],
  };
}

export function touchExperiment(experiment: Experiment): Experiment {
  return { ...experiment, updatedAt: new Date().toISOString() };
}
