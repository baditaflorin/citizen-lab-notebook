import { Cable, Download, FileUp, Plus, Trash2, Usb } from "lucide-react";
import { useRef, useState } from "react";
import { Section } from "../../components/Section";
import { downloadText } from "../../lib/download";
import type { SensorImportSummary, SensorReading } from "../../types";
import { createSampleReadings, readingsToCsv } from "./csv";
import { startSensorImport, type SensorImportTask } from "./importClient";
import type { SensorImportResult } from "./importer";
import { captureWebUsbReadings, isWebUsbSupported } from "./webUsb";

interface SensorPanelProps {
  readings: SensorReading[];
  importSummary: SensorImportSummary | null;
  onChange: (readings: SensorReading[]) => void;
  onImportComplete: (result: SensorImportResult) => void;
}

type ImportState =
  | { kind: "idle"; message: string }
  | { kind: "parsing"; message: string; requestId: string }
  | { kind: "imported"; message: string }
  | { kind: "cancelled"; message: string }
  | { kind: "recoverable-error"; message: string };

export function SensorPanel({
  readings,
  importSummary,
  onChange,
  onImportComplete,
}: SensorPanelProps) {
  const [csv, setCsv] = useState(
    "Time (s),Foam height (cm),label\n0,0.4,foam height\n60,0.7,foam height",
  );
  const [importState, setImportState] = useState<ImportState>({
    kind: "idle",
    message: "Import CSV, generate sample data, or capture from a WebUSB sensor.",
  });
  const activeTask = useRef<SensorImportTask | null>(null);

  function importCsv(contents = csv, sourceName = "pasted CSV") {
    activeTask.current?.cancel();
    let requestId = "";
    const task = startSensorImport(contents, sourceName, (message) =>
      setImportState({ kind: "parsing", message, requestId }),
    );
    requestId = task.requestId;
    activeTask.current = task;
    setImportState({ kind: "parsing", message: "Parsing sensor data", requestId: task.requestId });

    task.promise
      .then((result) => {
        if (activeTask.current?.requestId !== task.requestId) {
          return;
        }

        activeTask.current = null;

        if (result.readings.length === 0) {
          setImportState({
            kind: "recoverable-error",
            message:
              "No sensor readings were recognized. Try a CSV with a numeric sensor column or paste a smaller excerpt.",
          });
          return;
        }

        onImportComplete(result);
        setImportState({
          kind: "imported",
          message: `Imported ${result.readings.length} readings with ${result.summary.confidenceLabel} confidence.`,
        });
      })
      .catch((error: unknown) => {
        if (activeTask.current?.requestId !== task.requestId) {
          return;
        }

        activeTask.current = null;
        setImportState({
          kind: "recoverable-error",
          message:
            error instanceof Error
              ? error.message
              : "The sensor file could not be imported. Your existing readings were kept.",
        });
      });
  }

  async function importFile(file: File | undefined) {
    if (!file) {
      return;
    }

    importCsv(await file.text(), file.name);
  }

  function cancelImport() {
    activeTask.current?.cancel();
    activeTask.current = null;
    setImportState({
      kind: "cancelled",
      message: "Import cancelled. Existing readings were kept.",
    });
  }

  async function captureUsb() {
    try {
      setImportState({ kind: "idle", message: "Waiting for WebUSB device permission" });
      const result = await captureWebUsbReadings();

      if (result.readings.length === 0) {
        setImportState({
          kind: "recoverable-error",
          message: `${result.deviceLabel} connected, but no parseable readings arrived.`,
        });
        return;
      }

      onChange([...readings, ...result.readings]);
      setImportState({
        kind: "imported",
        message: `Captured ${result.readings.length} readings from ${result.deviceLabel}.`,
      });
    } catch (error) {
      setImportState({
        kind: "recoverable-error",
        message: error instanceof Error ? error.message : "WebUSB capture failed",
      });
    }
  }

  return (
    <Section
      title="Sensor Data"
      eyebrow="WebUSB + CSV"
      actions={
        <>
          <button
            className="ghost-button"
            type="button"
            onClick={() =>
              downloadText("sensor-readings.csv", readingsToCsv(readings), "text/csv;charset=utf-8")
            }
          >
            <Download size={16} />
            CSV
          </button>
          <button className="ghost-button danger" type="button" onClick={() => onChange([])}>
            <Trash2 size={16} />
            Clear
          </button>
        </>
      }
    >
      <div className="button-row">
        <button type="button" onClick={() => onChange([...readings, ...createSampleReadings()])}>
          <Plus size={16} />
          Sample
        </button>
        <button type="button" onClick={captureUsb} disabled={!isWebUsbSupported()}>
          <Usb size={16} />
          WebUSB
        </button>
        <label className="file-button">
          <FileUp size={16} />
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => importFile(event.target.files?.[0])}
          />
        </label>
      </div>

      <p className="status-line">
        <Cable size={14} /> {importState.message}
      </p>
      {importState.kind === "parsing" ? (
        <button className="ghost-button danger" type="button" onClick={cancelImport}>
          Cancel import
        </button>
      ) : null}

      {importSummary ? <ImportSummary summary={importSummary} /> : null}

      <label className="field">
        <span>CSV paste box</span>
        <textarea value={csv} onChange={(event) => setCsv(event.target.value)} rows={4} />
      </label>
      <button className="ghost-button" type="button" onClick={() => importCsv()}>
        <FileUp size={16} />
        Import pasted CSV
      </button>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Label</th>
            </tr>
          </thead>
          <tbody>
            {readings.slice(-10).map((reading) => (
              <tr key={reading.id}>
                <td>{reading.time}</td>
                <td>{reading.value}</td>
                <td>{reading.unit}</td>
                <td>{reading.label}</td>
              </tr>
            ))}
            {readings.length === 0 ? (
              <tr>
                <td colSpan={4}>No readings yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function ImportSummary({ summary }: { summary: SensorImportSummary }) {
  return (
    <div className={`import-summary ${summary.confidenceLabel}`}>
      <strong>
        {summary.sourceFormat} · {summary.importedCount} readings · {summary.confidenceLabel}{" "}
        confidence
      </strong>
      <p>{summary.reasons.join(" ")}</p>
      {summary.skippedRows.length > 0 ? (
        <p>
          Skipped {summary.skippedRows.length} row(s): {summary.skippedRows[0].reason}
        </p>
      ) : null}
      {summary.anomalies.length > 0 ? (
        <p>
          Flagged {summary.anomalies.length} issue(s): {summary.anomalies[0].message}
        </p>
      ) : null}
    </div>
  );
}
