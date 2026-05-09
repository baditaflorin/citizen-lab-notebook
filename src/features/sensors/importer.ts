import type { SensorReading } from "../../types";

export type ConfidenceLabel = "high" | "medium" | "low";

export interface InferredField {
  index: number;
  name: string;
  type: "time" | "timestamp" | "value" | "unit" | "label" | "metadata";
  unit?: string;
  confidence: number;
  reasons: string[];
}

export interface SkippedRow {
  lineNumber: number;
  raw: string;
  reason: string;
}

export interface DataAnomaly {
  type:
    | "missing-value"
    | "duplicate-time"
    | "outlier"
    | "formula-risk"
    | "partial-row"
    | "mixed-schema";
  severity: "info" | "warning" | "danger";
  message: string;
  lineNumber?: number;
  readingId?: string;
}

export interface SensorImportSummary {
  sourceId: string;
  sourceName: string;
  sourceFormat:
    | "empty"
    | "tabular-csv"
    | "metadata-preamble-csv"
    | "timestamped-logger-csv"
    | "arduino-serial-log"
    | "partial-single-column";
  delimiter: string;
  decimalSeparator: "." | ",";
  headerRow: number | null;
  rowCount: number;
  importedCount: number;
  skippedRows: SkippedRow[];
  anomalies: DataAnomaly[];
  fields: InferredField[];
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  reasons: string[];
  durationMs: number;
}

export interface SensorImportResult {
  readings: SensorReading[];
  summary: SensorImportSummary;
}

type SensorImportSummaryInput = Omit<SensorImportSummary, "confidenceLabel">;

interface ImportOptions {
  sourceName?: string;
  sourceId?: string;
}

interface CsvRecord {
  cells: string[];
  lineNumber: number;
  raw: string;
}

interface HeaderCandidate {
  index: number;
  score: number;
}

const delimiterCandidates = [",", ";", "\t", "|"] as const;
const formulaPrefix = /^[=+\-@]/;

export function analyzeSensorInput(
  contents: string,
  options: ImportOptions = {},
): SensorImportResult {
  const start = performance.now();
  const normalized = normalizeText(contents);
  const sourceId = options.sourceId ?? `src_${hashString(normalized)}`;
  const sourceName = options.sourceName ?? "pasted sensor data";

  if (!normalized.trim()) {
    return {
      readings: [],
      summary: buildSummary({
        sourceId,
        sourceName,
        sourceFormat: "empty",
        delimiter: ",",
        decimalSeparator: ".",
        headerRow: null,
        rowCount: 0,
        importedCount: 0,
        skippedRows: [
          {
            lineNumber: 1,
            raw: "",
            reason: "The file is empty, so there are no readings to import.",
          },
        ],
        anomalies: [],
        fields: [],
        confidence: 0,
        reasons: ["No text content was found."],
        durationMs: elapsed(start),
      }),
    };
  }

  const serial = parseArduinoSerial(normalized, sourceId, sourceName, start);

  if (serial) {
    return serial;
  }

  return parseTabular(normalized, sourceId, sourceName, start);
}

export function canonicalImportResult(result: SensorImportResult): Omit<
  SensorImportResult,
  "summary"
> & {
  summary: Omit<SensorImportSummary, "durationMs">;
} {
  const { durationMs, ...summary } = result.summary;
  void durationMs;
  return {
    readings: result.readings,
    summary,
  };
}

export function normalizeText(contents: string): string {
  return contents
    .replace(/^\uFEFF/, "")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\u0000", "")
    .replaceAll("\u00a0", " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trimEnd();
}

export function hashString(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}

function parseArduinoSerial(
  normalized: string,
  sourceId: string,
  sourceName: string,
  start: number,
): SensorImportResult | null {
  const lines = normalized
    .split("\n")
    .map((line, index) => ({ raw: line, lineNumber: index + 1, text: line.trim() }))
    .filter((line) => line.text.length > 0);
  const pairLines = lines.map((line) => ({
    ...line,
    pairs: [...line.text.matchAll(/([A-Za-z][\w\s/%°².-]*):\s*(-?\d+(?:[.,]\d+)?)/g)],
  }));
  const linesWithPairs = pairLines.filter((line) => line.pairs.length > 0);

  if (
    lines.filter((line) => line.text.includes(",") || line.text.includes(";")).length /
      lines.length >
    0.5
  ) {
    return null;
  }

  if (linesWithPairs.length < 2 || linesWithPairs.length / lines.length < 0.6) {
    return null;
  }

  const readings: SensorReading[] = [];
  const fields = new Map<string, InferredField>();
  const skippedRows: SkippedRow[] = [];
  const anomalies: DataAnomaly[] = [];

  for (const [sampleIndex, line] of pairLines.entries()) {
    if (line.pairs.length === 0) {
      skippedRows.push({
        lineNumber: line.lineNumber,
        raw: line.raw,
        reason: "This serial-log line did not contain any labelled numeric readings.",
      });
      continue;
    }

    for (const pair of line.pairs) {
      const label = normalizeLabel(pair[1]);
      const value = parseNumber(pair[2], ".");

      if (value === null) {
        skippedRows.push({
          lineNumber: line.lineNumber,
          raw: line.raw,
          reason: `The ${label} reading was not numeric.`,
        });
        continue;
      }

      if (!fields.has(label)) {
        fields.set(label, {
          index: fields.size,
          name: label,
          type: "value",
          confidence: 0.75,
          reasons: ["Detected labelled numeric pairs in serial log text."],
        });
      }

      readings.push({
        id: stableReadingId(sourceId, line.lineNumber, fields.get(label)?.index ?? 0, label),
        time: sampleIndex,
        value,
        unit: inferUnitFromLabel(label) ?? "",
        label,
      });
    }
  }

  addAnomalies(readings, anomalies);

  return {
    readings,
    summary: buildSummary({
      sourceId,
      sourceName,
      sourceFormat: "arduino-serial-log",
      delimiter: "serial-labels",
      decimalSeparator: ".",
      headerRow: null,
      rowCount: lines.length,
      importedCount: readings.length,
      skippedRows,
      anomalies,
      fields: [...fields.values()],
      confidence: scoreConfidence({
        rowCount: lines.length,
        importedCount: readings.length,
        skippedRows,
        anomalies,
        hasHeader: false,
        generatedTime: true,
      }),
      reasons: [
        "Detected repeated labelled numeric pairs such as `temperature: 23.4`.",
        "No time column was present, so sample index was used as elapsed time.",
      ],
      durationMs: elapsed(start),
    }),
  };
}

function parseTabular(
  normalized: string,
  sourceId: string,
  sourceName: string,
  start: number,
): SensorImportResult {
  const dialect = extractDialectMarker(normalized);
  const delimiter = dialect.delimiter ?? sniffDelimiter(dialect.text);
  const records = parseDelimited(dialect.text, delimiter);
  const decimalSeparator = inferDecimalSeparator(records, delimiter);
  const header = findHeader(records, decimalSeparator);
  const fields = inferFields(records, header?.index ?? null, decimalSeparator);
  const skippedRows: SkippedRow[] = [...dialect.skippedRows];
  const anomalies: DataAnomaly[] = [];
  const readings: SensorReading[] = [];
  const dataRecords = records.filter((record, index) => {
    if (isIgnorableRecord(record)) {
      return false;
    }

    if (header && index <= header.index) {
      if (index < header.index) {
        skippedRows.push({
          lineNumber: record.lineNumber,
          raw: record.raw,
          reason: "Metadata preamble row skipped before the detected header.",
        });
      }

      return false;
    }

    return true;
  });
  const timeField = fields.find((field) => field.type === "time" || field.type === "timestamp");
  const valueFields = fields.filter((field) => field.type === "value");
  const unitField = fields.find((field) => field.type === "unit");
  const labelField = fields.find((field) => field.type === "label");
  const baseTimestamp = firstTimestamp(dataRecords, timeField, decimalSeparator);
  let generatedTime = 0;

  for (const record of dataRecords) {
    const row = record.cells.map((cell) => normalizeCell(cell));

    if (row.length < Math.max(1, ...fields.map((field) => field.index + 1))) {
      anomalies.push({
        type: "partial-row",
        severity: "warning",
        message: `Row ${record.lineNumber} has fewer fields than the detected data shape.`,
        lineNumber: record.lineNumber,
      });
    }

    detectFormulaRisk(row, record, anomalies);

    const time = inferTime(row, timeField, decimalSeparator, baseTimestamp, generatedTime);
    let importedFromRow = 0;

    for (const field of valueFields) {
      const rawValue = row[field.index] ?? "";
      const value = parseNumber(rawValue, decimalSeparator);

      if (value === null) {
        skippedRows.push({
          lineNumber: record.lineNumber,
          raw: record.raw,
          reason: `The ${field.name} value was missing or not numeric.`,
        });
        anomalies.push({
          type: "missing-value",
          severity: "warning",
          message: `Missing numeric value for ${field.name} on row ${record.lineNumber}.`,
          lineNumber: record.lineNumber,
        });
        continue;
      }

      const rawLabel = labelField ? row[labelField.index] : "";
      const label =
        rawLabel && !formulaPrefix.test(rawLabel.trim())
          ? normalizeLabel(rawLabel)
          : normalizeLabel(field.name);
      const unit = unitField ? normalizeUnit(row[unitField.index]) : (field.unit ?? "");
      const readingId = stableReadingId(sourceId, record.lineNumber, field.index, label);

      readings.push({
        id: readingId,
        time,
        value,
        unit,
        label,
      });
      importedFromRow += 1;
    }

    if (importedFromRow > 0) {
      generatedTime += 1;
    }
  }

  addAnomalies(readings, anomalies);

  const sourceFormat = inferSourceFormat({
    records,
    headerIndex: header?.index ?? null,
    fields,
    timeField,
    valueFields,
  });
  const confidence = scoreConfidence({
    rowCount: records.length,
    importedCount: readings.length,
    skippedRows,
    anomalies,
    hasHeader: Boolean(header),
    generatedTime: !timeField,
  });

  return {
    readings,
    summary: buildSummary({
      sourceId,
      sourceName,
      sourceFormat,
      delimiter,
      decimalSeparator,
      headerRow: header ? records[header.index].lineNumber : null,
      rowCount: records.length,
      importedCount: readings.length,
      skippedRows,
      anomalies,
      fields,
      confidence,
      reasons: buildReasons({
        delimiter,
        decimalSeparator,
        header,
        fields,
        sourceFormat,
        timeField,
      }),
      durationMs: elapsed(start),
    }),
  };
}

function buildSummary(summary: SensorImportSummaryInput): SensorImportSummary {
  return {
    ...summary,
    confidence: round(summary.confidence, 3),
    confidenceLabel: confidenceLabel(summary.confidence),
    skippedRows: summary.skippedRows.slice(0, 50),
    anomalies: summary.anomalies.slice(0, 50),
  };
}

function extractDialectMarker(text: string): {
  text: string;
  delimiter?: string;
  skippedRows: SkippedRow[];
} {
  const lines = text.split("\n");
  const first = lines[0]?.trim();
  const match = first?.match(/^sep=(.)$/i);

  if (!match) {
    return { text, skippedRows: [] };
  }

  return {
    text: lines.slice(1).join("\n"),
    delimiter: match[1],
    skippedRows: [
      {
        lineNumber: 1,
        raw: lines[0],
        reason: "Spreadsheet delimiter marker recognized and skipped.",
      },
    ],
  };
}

function sniffDelimiter(text: string): string {
  let best = ",";
  let bestScore = -Infinity;

  for (const delimiter of delimiterCandidates) {
    const records = parseDelimited(text, delimiter).filter((record) => !isIgnorableRecord(record));
    const widths = records.map((record) => record.cells.length);
    const multiCell = widths.filter((width) => width > 1).length;
    const commonWidth = mode(widths);
    const consistency =
      widths.filter((width) => width === commonWidth).length / Math.max(widths.length, 1);
    const headerBonus = records.some((record) =>
      record.cells.some((cell) => /time|timestamp|date|value|height|accel|temp|light/i.test(cell)),
    )
      ? 3
      : 0;
    const score = multiCell * 4 + consistency * 8 + commonWidth + headerBonus;

    if (score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }

  return best;
}

function parseDelimited(text: string, delimiter: string): CsvRecord[] {
  const records: CsvRecord[] = [];
  let row: string[] = [];
  let cell = "";
  let raw = "";
  let inQuotes = false;
  let lineNumber = 1;
  let recordStart = 1;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    pushCell();

    if (row.some((item) => item.trim().length > 0)) {
      records.push({ cells: row, lineNumber: recordStart, raw });
    }

    row = [];
    raw = "";
    recordStart = lineNumber + 1;
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    raw += char;

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        raw += next;
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      pushCell();
      continue;
    }

    if (!inQuotes && char === "\n") {
      raw = raw.slice(0, -1);
      pushRow();
      lineNumber += 1;
      continue;
    }

    if (char === "\n") {
      lineNumber += 1;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0 || raw.trim().length > 0) {
    pushRow();
  }

  return records;
}

function findHeader(records: CsvRecord[], decimalSeparator: "." | ","): HeaderCandidate | null {
  let best: HeaderCandidate | null = null;

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];

    if (isIgnorableRecord(record)) {
      continue;
    }

    const cells = record.cells.map((cell) => normalizeCell(cell));
    const nextRows = records.slice(index + 1, index + 6).filter((row) => !isIgnorableRecord(row));
    const alphaCount = cells.filter((cell) => /[A-Za-z]/.test(cell)).length;
    const unitCount = cells.filter((cell) => /\(.+\)|\[.+\]/.test(cell)).length;
    const tokenCount = cells.filter((cell) =>
      /time|timestamp|date|value|height|accel|temperature|humidity|light|sensor|unit|label/i.test(
        cell,
      ),
    ).length;
    const nextNumericRate = numericRate(
      nextRows.flatMap((row) => row.cells),
      decimalSeparator,
    );
    const score =
      alphaCount * 2 + unitCount * 2 + tokenCount * 3 + nextNumericRate * 5 - index * 0.1;

    if (alphaCount > 0 && nextNumericRate > 0.25 && (!best || score > best.score)) {
      best = { index, score };
    }
  }

  return best;
}

function inferFields(
  records: CsvRecord[],
  headerIndex: number | null,
  decimalSeparator: "." | ",",
): InferredField[] {
  const header =
    headerIndex === null ? [] : records[headerIndex]?.cells.map((cell) => normalizeCell(cell));
  const dataRows = records
    .slice(headerIndex === null ? 0 : headerIndex + 1)
    .filter((record) => !isIgnorableRecord(record));
  const maxWidth = Math.max(1, ...dataRows.map((row) => row.cells.length), header.length);
  const fields: InferredField[] = [];

  for (let index = 0; index < maxWidth; index += 1) {
    const rawName = header[index] || `Column ${index + 1}`;
    const name = normalizeLabel(rawName.replace(/\(.+?\)|\[.+?\]/g, "").trim() || rawName);
    const unit = inferUnitFromLabel(rawName);
    const values = dataRows.map((row) => normalizeCell(row.cells[index] ?? ""));
    const numeric = numericRate(values, decimalSeparator);
    const timestamp = timestampRate(values);
    const lower = rawName.toLowerCase();
    const reasons: string[] = [];
    let type: InferredField["type"] = "metadata";
    let confidence = 0.5;

    if (/timestamp|date/.test(lower) || timestamp > 0.6) {
      type = "timestamp";
      confidence = Math.max(0.75, timestamp);
      reasons.push("Header or values look like timestamps.");
    } else if (/time|elapsed|seconds|\(s\)|\(ms\)/.test(lower)) {
      type = "time";
      confidence = Math.max(0.8, numeric);
      reasons.push("Header names an elapsed time field.");
    } else if (/^unit$|units?/.test(lower)) {
      type = "unit";
      confidence = 0.85;
      reasons.push("Header names a unit field.");
    } else if (/^label$|sensor|measurement/.test(lower)) {
      type = "label";
      confidence = 0.85;
      reasons.push("Header names a reading label field.");
    } else if (numeric > 0.55) {
      type = "value";
      confidence = Math.max(0.6, numeric);
      reasons.push("Most rows in this column are numeric sensor values.");
    } else {
      reasons.push("Column kept as metadata because it is not numeric enough for analysis.");
    }

    fields.push({
      index,
      name,
      type,
      unit,
      confidence: round(confidence, 3),
      reasons,
    });
  }

  if (!fields.some((field) => field.type === "value") && fields.length === 1) {
    fields[0] = {
      ...fields[0],
      type: "value",
      confidence: 0.55,
      reasons: ["Single-column numeric-looking data was treated as one sensor channel."],
    };
  }

  return fields;
}

function inferDecimalSeparator(records: CsvRecord[], delimiter: string): "." | "," {
  if (delimiter !== ",") {
    const commaDecimals = records
      .flatMap((record) => record.cells)
      .filter((cell) => /^-?\d+,\d+$/.test(cell.trim())).length;

    if (commaDecimals > 0) {
      return ",";
    }
  }

  return ".";
}

function inferTime(
  row: string[],
  timeField: InferredField | undefined,
  decimalSeparator: "." | ",",
  baseTimestamp: number | null,
  generatedTime: number,
): number {
  if (!timeField) {
    return generatedTime;
  }

  const raw = row[timeField.index] ?? "";

  if (timeField.type === "timestamp") {
    const timestamp = Date.parse(raw);

    if (Number.isFinite(timestamp) && baseTimestamp !== null) {
      return round((timestamp - baseTimestamp) / 1000, 6);
    }
  }

  const numeric = parseNumber(raw, decimalSeparator);

  if (numeric !== null) {
    return /\(ms\)/i.test(timeField.name) ? numeric / 1000 : numeric;
  }

  return generatedTime;
}

function firstTimestamp(
  records: CsvRecord[],
  timeField: InferredField | undefined,
  decimalSeparator: "." | ",",
): number | null {
  if (!timeField || timeField.type !== "timestamp") {
    return null;
  }

  for (const record of records) {
    const timestamp = Date.parse(normalizeCell(record.cells[timeField.index] ?? ""));

    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  return decimalSeparator === "," ? null : null;
}

function inferSourceFormat(args: {
  records: CsvRecord[];
  headerIndex: number | null;
  fields: InferredField[];
  timeField: InferredField | undefined;
  valueFields: InferredField[];
}): SensorImportSummary["sourceFormat"] {
  if (args.valueFields.length === 1 && !args.timeField) {
    return "partial-single-column";
  }

  if (args.timeField?.type === "timestamp") {
    return "timestamped-logger-csv";
  }

  const meaningfulPreamble =
    args.headerIndex === null
      ? 0
      : args.records.slice(0, args.headerIndex).filter((record) => !isIgnorableRecord(record))
          .length;

  if (meaningfulPreamble > 0) {
    return "metadata-preamble-csv";
  }

  return "tabular-csv";
}

function buildReasons(args: {
  delimiter: string;
  decimalSeparator: "." | ",";
  header: HeaderCandidate | null;
  fields: InferredField[];
  sourceFormat: string;
  timeField: InferredField | undefined;
}): string[] {
  const reasons = [
    `Detected source shape: ${args.sourceFormat}.`,
    `Detected delimiter: ${args.delimiter === "\t" ? "tab" : args.delimiter}.`,
    `Detected decimal separator: ${args.decimalSeparator}.`,
  ];

  if (args.header) {
    reasons.push("Detected a header row from lab-data words and numeric rows below it.");
  } else {
    reasons.push("No explicit header was found; generated field names were used.");
  }

  if (!args.timeField) {
    reasons.push("No time column was found, so sample index was used as elapsed time.");
  }

  reasons.push(
    `Detected ${args.fields.filter((field) => field.type === "value").length} sensor value column(s).`,
  );
  return reasons;
}

function addAnomalies(readings: SensorReading[], anomalies: DataAnomaly[]): void {
  const byLabel = groupBy(readings, (reading) => reading.label);

  for (const labelReadings of byLabel.values()) {
    const seenTimes = new Map<number, SensorReading>();

    for (const reading of labelReadings) {
      const previous = seenTimes.get(reading.time);

      if (previous) {
        anomalies.push({
          type: "duplicate-time",
          severity: "warning",
          message: `Duplicate elapsed time ${reading.time} detected for ${reading.label}.`,
          readingId: reading.id,
        });
      } else {
        seenTimes.set(reading.time, reading);
      }
    }

    for (const outlier of detectOutliers(labelReadings)) {
      anomalies.push({
        type: "outlier",
        severity: "warning",
        message: `${outlier.label} value ${outlier.value} is far from the rest of that sensor series.`,
        readingId: outlier.id,
      });
    }
  }
}

function detectOutliers(readings: SensorReading[]): SensorReading[] {
  if (readings.length < 4) {
    return [];
  }

  const values = readings.map((reading) => reading.value).sort((a, b) => a - b);
  const medianValue = median(values);
  const deviations = values.map((value) => Math.abs(value - medianValue)).sort((a, b) => a - b);
  const mad = median(deviations);

  if (mad === 0) {
    return [];
  }

  return readings.filter((reading) => Math.abs(reading.value - medianValue) / mad > 10);
}

function detectFormulaRisk(row: string[], record: CsvRecord, anomalies: DataAnomaly[]): void {
  for (const cell of row) {
    const trimmed = cell.trim();

    if (
      formulaPrefix.test(trimmed) &&
      parseNumber(trimmed, ".") === null &&
      parseNumber(trimmed, ",") === null
    ) {
      anomalies.push({
        type: "formula-risk",
        severity: "danger",
        message: `Row ${record.lineNumber} contains a spreadsheet formula-like label. It will be neutralized on export.`,
        lineNumber: record.lineNumber,
      });
    }
  }
}

function parseNumber(raw: string, decimalSeparator: "." | ","): number | null {
  const trimmed = normalizeCell(raw)
    .replace(/\s+/g, "")
    .replace(/^[^\d+.,-]+|[^\d.,-]+$/g, "");

  if (!trimmed) {
    return null;
  }

  const normalized =
    decimalSeparator === "," ? trimmed.replace(",", ".") : trimmed.replace(/,/g, "");
  const value = Number(normalized);

  return Number.isFinite(value) ? value : null;
}

function numericRate(values: string[], decimalSeparator: "." | ","): number {
  const useful = values.filter((value) => normalizeCell(value).length > 0);

  if (useful.length === 0) {
    return 0;
  }

  return (
    useful.filter((value) => parseNumber(value, decimalSeparator) !== null).length / useful.length
  );
}

function timestampRate(values: string[]): number {
  const useful = values.filter((value) => {
    const cell = normalizeCell(value);
    return cell.length > 0 && /[-/:TZ]|AM|PM/i.test(cell) && parseNumber(cell, ".") === null;
  });

  if (useful.length === 0) {
    return 0;
  }

  return useful.filter((value) => Number.isFinite(Date.parse(value))).length / useful.length;
}

function scoreConfidence(args: {
  rowCount: number;
  importedCount: number;
  skippedRows: SkippedRow[];
  anomalies: DataAnomaly[];
  hasHeader: boolean;
  generatedTime: boolean;
}): number {
  if (args.importedCount === 0) {
    return 0.1;
  }

  const meaningfulSkipped = args.skippedRows.filter(
    (row) =>
      !row.reason.includes("Metadata preamble") &&
      !row.reason.includes("delimiter marker recognized"),
  );
  const skippedPenalty = Math.min(0.3, meaningfulSkipped.length / Math.max(args.rowCount, 1));
  const anomalyPenalty = Math.min(0.3, args.anomalies.length * 0.04);
  const headerPenalty = args.hasHeader ? 0 : 0.12;
  const timePenalty = args.generatedTime ? 0.08 : 0;

  return Math.max(
    0.1,
    Math.min(1, 1 - skippedPenalty - anomalyPenalty - headerPenalty - timePenalty),
  );
}

function confidenceLabel(confidence: number): ConfidenceLabel {
  if (confidence >= 0.8) {
    return "high";
  }

  if (confidence >= 0.55) {
    return "medium";
  }

  return "low";
}

function stableReadingId(
  sourceId: string,
  lineNumber: number,
  fieldIndex: number,
  label: string,
): string {
  return `reading_${sourceId}_${lineNumber}_${fieldIndex}_${hashString(label)}`;
}

function normalizeCell(cell: string): string {
  return cell.trim().replace(/\s+/g, " ");
}

function normalizeLabel(label: string): string {
  return normalizeCell(label)
    .replace(/\s+#.*$/u, "")
    .replace(/^["']|["']$/g, "")
    .replace(/\s*\(.+?\)\s*$/, "")
    .trim();
}

function normalizeUnit(unit: string | undefined): string {
  return normalizeCell(unit ?? "");
}

function inferUnitFromLabel(label: string): string | undefined {
  return label
    .match(/\((.+?)\)|\[(.+?)\]/)
    ?.slice(1)
    .find(Boolean);
}

function isIgnorableRecord(record: CsvRecord): boolean {
  const first = normalizeCell(record.cells[0] ?? "");
  return first.length === 0 || first.startsWith("#") || first.startsWith("//");
}

function mode(values: number[]): number {
  const counts = new Map<number, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0] ?? 0;
}

function median(values: number[]): number {
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0 ? (values[middle - 1] + values[middle]) / 2 : values[middle];
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const groupKey = key(item);
    const group = groups.get(groupKey);

    if (group) {
      group.push(item);
    } else {
      groups.set(groupKey, [item]);
    }
  }

  return groups;
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function elapsed(start: number): number {
  return round(performance.now() - start, 3);
}
