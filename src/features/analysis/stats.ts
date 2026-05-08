import type { SensorReading } from "../../types";

export interface SummaryStats {
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  standardDeviation: number | null;
  slope: number | null;
  intercept: number | null;
  rSquared: number | null;
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function computeSummaryStats(readings: SensorReading[]): SummaryStats {
  const points = readings
    .filter((reading) => Number.isFinite(reading.time) && Number.isFinite(reading.value))
    .sort((a, b) => a.time - b.time);

  if (points.length === 0) {
    return {
      count: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      standardDeviation: null,
      slope: null,
      intercept: null,
      rSquared: null,
    };
  }

  const values = points.map((point) => point.value).sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((total, value) => total + value, 0);
  const mean = sum / count;
  const median =
    count % 2 === 0
      ? (values[count / 2 - 1] + values[count / 2]) / 2
      : values[Math.floor(count / 2)];
  const variance =
    count > 1 ? values.reduce((total, value) => total + (value - mean) ** 2, 0) / (count - 1) : 0;

  const regression = linearRegression(points.map((point) => [point.time, point.value] as const));

  return {
    count,
    min: round(values[0]),
    max: round(values[values.length - 1]),
    mean: round(mean),
    median: round(median),
    standardDeviation: round(Math.sqrt(variance)),
    slope: regression ? round(regression.slope) : null,
    intercept: regression ? round(regression.intercept) : null,
    rSquared: regression ? round(regression.rSquared) : null,
  };
}

export function linearRegression(
  points: ReadonlyArray<readonly [number, number]>,
): { slope: number; intercept: number; rSquared: number } | null {
  if (points.length < 2) {
    return null;
  }

  const count = points.length;
  const sumX = points.reduce((total, [x]) => total + x, 0);
  const sumY = points.reduce((total, [, y]) => total + y, 0);
  const meanX = sumX / count;
  const meanY = sumY / count;

  const ssXX = points.reduce((total, [x]) => total + (x - meanX) ** 2, 0);
  const ssXY = points.reduce((total, [x, y]) => total + (x - meanX) * (y - meanY), 0);

  if (ssXX === 0) {
    return null;
  }

  const slope = ssXY / ssXX;
  const intercept = meanY - slope * meanX;
  const ssTot = points.reduce((total, [, y]) => total + (y - meanY) ** 2, 0);
  const ssRes = points.reduce((total, [x, y]) => total + (y - (slope * x + intercept)) ** 2, 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, rSquared };
}
