import { createId, type SensorReading } from "../../types";

export function parseSensorCsv(contents: string, fallbackUnit = ""): SensorReading[] {
  const lines = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const first = lines[0].toLowerCase();
  const hasHeader = first.includes("time") || first.includes("value");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.flatMap((line, index) => {
    const [timeRaw, valueRaw, unitRaw, labelRaw] = line.split(",").map((part) => part.trim());
    const time = Number(timeRaw);
    const value = Number(valueRaw);

    if (!Number.isFinite(time) || !Number.isFinite(value)) {
      return [];
    }

    return [
      {
        id: createId("reading"),
        time,
        value,
        unit: unitRaw ?? fallbackUnit,
        label: labelRaw || `csv-${index + 1}`,
      },
    ];
  });
}

export function readingsToCsv(readings: SensorReading[]): string {
  const rows = readings.map((reading) =>
    [reading.time, reading.value, reading.unit, reading.label]
      .map((value) => String(value).replaceAll('"', '""'))
      .map((value) => (value.includes(",") ? `"${value}"` : value))
      .join(","),
  );

  return ["time,value,unit,label", ...rows].join("\n");
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
