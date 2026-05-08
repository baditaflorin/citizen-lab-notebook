import { Cable, Download, FileUp, Plus, Trash2, Usb } from "lucide-react";
import { useState } from "react";
import { Section } from "../../components/Section";
import { downloadText } from "../../lib/download";
import type { SensorReading } from "../../types";
import { createSampleReadings, parseSensorCsv, readingsToCsv } from "./csv";
import { captureWebUsbReadings, isWebUsbSupported } from "./webUsb";

interface SensorPanelProps {
  readings: SensorReading[];
  onChange: (readings: SensorReading[]) => void;
}

export function SensorPanel({ readings, onChange }: SensorPanelProps) {
  const [csv, setCsv] = useState("time,value,unit,label\n0,0.4,cm,foam height\n60,0.7,cm,foam height");
  const [status, setStatus] = useState("Import CSV, generate sample data, or capture from a WebUSB sensor.");

  function importCsv(contents = csv) {
    const parsed = parseSensorCsv(contents, readings[0]?.unit ?? "");

    if (parsed.length === 0) {
      setStatus("No valid CSV rows found. Use columns: time,value,unit,label.");
      return;
    }

    onChange([...readings, ...parsed]);
    setStatus(`Imported ${parsed.length} readings.`);
  }

  async function importFile(file: File | undefined) {
    if (!file) {
      return;
    }

    importCsv(await file.text());
  }

  async function captureUsb() {
    try {
      setStatus("Waiting for WebUSB device permission");
      const result = await captureWebUsbReadings();

      if (result.readings.length === 0) {
        setStatus(`${result.deviceLabel} connected, but no parseable readings arrived.`);
        return;
      }

      onChange([...readings, ...result.readings]);
      setStatus(`Captured ${result.readings.length} readings from ${result.deviceLabel}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "WebUSB capture failed");
    }
  }

  return (
    <Section
      title="Sensor Data"
      eyebrow="WebUSB + CSV"
      actions={
        <>
          <button className="ghost-button" type="button" onClick={() => downloadText("sensor-readings.csv", readingsToCsv(readings), "text/csv;charset=utf-8")}>
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
          <input type="file" accept=".csv,text/csv" onChange={(event) => importFile(event.target.files?.[0])} />
        </label>
      </div>

      <p className="status-line">
        <Cable size={14} /> {status}
      </p>

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
