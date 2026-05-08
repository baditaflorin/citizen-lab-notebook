import type { SensorReading } from "../../types";
import { linearRegression } from "./stats";

function scale(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  if (fromMax === fromMin) {
    return (toMin + toMax) / 2;
  }

  return toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderSensorFigure(readings: SensorReading[], title: string): string {
  const points = readings
    .filter((reading) => Number.isFinite(reading.time) && Number.isFinite(reading.value))
    .sort((a, b) => a.time - b.time);

  const width = 720;
  const height = 360;
  const margin = { top: 42, right: 28, bottom: 58, left: 70 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  if (points.length === 0) {
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Empty sensor figure" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="#fbfbf7"/><text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#526056" font-family="system-ui" font-size="18">Add sensor data to render a figure</text></svg>`;
  }

  const minX = Math.min(...points.map((point) => point.time));
  const maxX = Math.max(...points.map((point) => point.time));
  const minY = Math.min(...points.map((point) => point.value));
  const maxY = Math.max(...points.map((point) => point.value));
  const yPadding = Math.max((maxY - minY) * 0.12, 1);
  const unit = points.find((point) => point.unit)?.unit ?? "";
  const regression = linearRegression(points.map((point) => [point.time, point.value] as const));

  const toX = (time: number) => scale(time, minX, maxX, margin.left, margin.left + plotWidth);
  const toY = (value: number) =>
    scale(value, minY - yPadding, maxY + yPadding, margin.top + plotHeight, margin.top);

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${toX(point.time).toFixed(2)} ${toY(point.value).toFixed(2)}`)
    .join(" ");

  const dots = points
    .map(
      (point) =>
        `<circle cx="${toX(point.time).toFixed(2)}" cy="${toY(point.value).toFixed(2)}" r="4.5" fill="#bd4f3f"><title>${point.time}s, ${point.value}${escapeXml(unit)}</title></circle>`,
    )
    .join("");

  const regressionLine = regression
    ? `<line x1="${toX(minX).toFixed(2)}" y1="${toY(regression.slope * minX + regression.intercept).toFixed(2)}" x2="${toX(maxX).toFixed(2)}" y2="${toY(regression.slope * maxX + regression.intercept).toFixed(2)}" stroke="#6d5bd0" stroke-width="3" stroke-dasharray="8 7"/>`
    : "";

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)} sensor figure" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" rx="8" fill="#fbfbf7"/>
  <text x="${margin.left}" y="28" fill="#17211b" font-family="system-ui" font-size="19" font-weight="700">${escapeXml(title)}</text>
  <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#879083"/>
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#879083"/>
  <text x="${margin.left + plotWidth / 2}" y="${height - 18}" text-anchor="middle" fill="#526056" font-family="system-ui" font-size="14">Time</text>
  <text x="18" y="${margin.top + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 18 ${margin.top + plotHeight / 2})" fill="#526056" font-family="system-ui" font-size="14">Value ${escapeXml(unit)}</text>
  <text x="${margin.left}" y="${height - 34}" fill="#526056" font-family="system-ui" font-size="12">${minX}</text>
  <text x="${margin.left + plotWidth}" y="${height - 34}" text-anchor="end" fill="#526056" font-family="system-ui" font-size="12">${maxX}</text>
  <text x="${margin.left - 10}" y="${toY(minY).toFixed(2)}" text-anchor="end" dominant-baseline="middle" fill="#526056" font-family="system-ui" font-size="12">${minY.toFixed(2)}</text>
  <text x="${margin.left - 10}" y="${toY(maxY).toFixed(2)}" text-anchor="end" dominant-baseline="middle" fill="#526056" font-family="system-ui" font-size="12">${maxY.toFixed(2)}</text>
  <path d="${path}" fill="none" stroke="#005f73" stroke-width="3"/>
  ${regressionLine}
  ${dots}
</svg>`;
}
