import type { Experiment } from "../types";

interface DebugOverlayProps {
  experiment: Experiment;
}

export function DebugOverlay({ experiment }: DebugOverlayProps) {
  const enabled = new URLSearchParams(window.location.search).get("debug") === "1";

  if (!enabled) {
    return null;
  }

  return (
    <aside className="debug-overlay" aria-label="Debug state">
      <h2>Debug</h2>
      <pre>
        {JSON.stringify(
          {
            experimentId: experiment.id,
            readings: experiment.sensorReadings.length,
            importSummary: experiment.sensorImportSummary,
            activityLog: experiment.activityLog,
          },
          null,
          2,
        )}
      </pre>
    </aside>
  );
}
