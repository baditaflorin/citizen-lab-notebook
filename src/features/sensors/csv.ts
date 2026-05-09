import { createId, type SensorReading } from "../../types";
import { analyzeSensorInput } from "./importer";

export function parseSensorCsv(contents: string, fallbackUnit = ""): SensorReading[] {
  const readings = analyzeSensorInput(contents, { sourceName: "CSV paste" }).readings;
  return fallbackUnit
    ? readings.map((reading) => ({ ...reading, unit: reading.unit || fallbackUnit }))
    : readings;
}

export function readingsToCsv(readings: SensorReading[]): string {
  const rows = readings.map((reading) =>
    [reading.time, reading.value, reading.unit, reading.label]
      .map((value) => escapeCsvCell(String(value)))
      .join(","),
  );

  return ["time,value,unit,label", ...rows].join("\n");
}

function escapeCsvCell(value: string): string {
  const safeValue = /^[=+\-@]/.test(value.trim()) ? `'${value}` : value;
  const escaped = safeValue.replaceAll('"', '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function createSampleReadings(): SensorReading[] {
  const values = [0.4, 0.7, 1.1, 1.8, 2.5, 3.1, 3.8, 4.4, 4.9, 5.2];

  return values.map((value, index) => ({
    id: createId("reading"),
    time: index * 60,
    value,
    unit: "cm",
    label: "foam height",
  }));
}
