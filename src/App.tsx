import { useEffect, useMemo, useState } from "react";
import { CapabilityGrid } from "./components/CapabilityGrid";
import { DebugOverlay } from "./components/DebugOverlay";
import { Header } from "./components/Header";
import { AnalysisPanel } from "./features/analysis/AnalysisPanel";
import { renderSensorFigure } from "./features/analysis/figure";
import { computeSummaryStats, selectPrimarySeries } from "./features/analysis/stats";
import { ExperimentSetup } from "./features/experiments/ExperimentSetup";
import { ImagePanel } from "./features/images/ImagePanel";
import { ReportPanel } from "./features/report/ReportPanel";
import { SensorPanel } from "./features/sensors/SensorPanel";
import type { SensorImportResult } from "./features/sensors/importer";
import { VoicePanel } from "./features/voice/VoicePanel";
import { resolveCommitInfo, type CommitInfo } from "./lib/buildInfo";
import { downloadText } from "./lib/download";
import {
  exportExperimentJson,
  importExperimentJson,
  listExperiments,
  saveExperiment,
} from "./lib/storage";
import {
  createExperiment,
  createId,
  touchExperiment,
  type Experiment,
  type ImageMetadata,
  type SensorReading,
  type VoiceNote,
} from "./types";

export function App() {
  const [experiment, setExperiment] = useState<Experiment>(() => createExperiment());
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("loading local notebook");
  const [commit, setCommit] = useState<CommitInfo | null>(null);

  const primarySeries = useMemo(
    () => selectPrimarySeries(experiment.sensorReadings),
    [experiment.sensorReadings],
  );
  const stats = useMemo(
    () => computeSummaryStats(primarySeries.readings),
    [primarySeries.readings],
  );
  const figureSvg = useMemo(
    () => renderSensorFigure(primarySeries.readings, experiment.title || "Experiment figure"),
    [primarySeries.readings, experiment.title],
  );

  useEffect(() => {
    let cancelled = false;

    listExperiments()
      .then((experiments) => {
        if (cancelled) {
          return;
        }

        if (experiments[0]) {
          setExperiment(experiments[0]);
        }

        setLoaded(true);
        setSaveState("local notebook ready");
      })
      .catch((error: unknown) => {
        setLoaded(true);
        setSaveState(error instanceof Error ? error.message : "local storage unavailable");
      });

    resolveCommitInfo().then((info) => {
      if (!cancelled) {
        setCommit(info);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    setSaveState("saving");
    const timeout = window.setTimeout(() => {
      saveExperiment(experiment)
        .then(() => setSaveState("saved locally"))
        .catch((error: unknown) =>
          setSaveState(error instanceof Error ? error.message : "could not save locally"),
        );
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [experiment, loaded]);

  function updateExperiment(patch: Partial<Experiment>) {
    setExperiment((current) => touchExperiment({ ...current, ...patch }));
  }

  function updateReadings(sensorReadings: SensorReading[]) {
    updateExperiment({ sensorReadings });
  }

  function appendActivity(
    type: Experiment["activityLog"][number]["type"],
    summary: string,
    experimentOverride = experiment,
  ): Experiment["activityLog"] {
    return [
      ...experimentOverride.activityLog,
      {
        id: createId("activity"),
        createdAt: new Date().toISOString(),
        type,
        summary,
      },
    ];
  }

  function handleSensorImport(result: SensorImportResult) {
    updateExperiment({
      sensorReadings: [...experiment.sensorReadings, ...result.readings],
      sensorImportSummary: result.summary,
      activityLog: appendActivity(
        "sensor-imported",
        `Imported ${result.readings.length} readings from ${result.summary.sourceName} with ${result.summary.confidenceLabel} confidence.`,
      ),
    });
  }

  function addVoiceNote(note: VoiceNote) {
    updateExperiment({ voiceNotes: [...experiment.voiceNotes, note] });
  }

  function deleteVoiceNote(id: string) {
    updateExperiment({ voiceNotes: experiment.voiceNotes.filter((note) => note.id !== id) });
  }

  function addImageMetadata(image: ImageMetadata) {
    updateExperiment({ imageMetadata: [...experiment.imageMetadata, image] });
  }

  function deleteImageMetadata(id: string) {
    updateExperiment({
      imageMetadata: experiment.imageMetadata.filter((image) => image.id !== id),
    });
  }

  function newExperiment() {
    setExperiment(createExperiment());
    setSaveState("new notebook created");
  }

  function exportJson() {
    updateExperiment({
      activityLog: appendActivity("report-exported", "Notebook JSON exported."),
    });
    downloadText(
      `${experiment.title || "experiment"}.json`,
      exportExperimentJson(experiment),
      "application/json",
    );
  }

  async function importJson(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const imported = importExperimentJson(await file.text());
      setExperiment(
        touchExperiment({
          ...imported,
          activityLog: appendActivity("notebook-imported", "Notebook JSON imported.", imported),
        }),
      );
      setSaveState("imported notebook");
    } catch (error) {
      setSaveState(error instanceof Error ? error.message : "import failed");
    }
  }

  return (
    <div className="app-shell">
      <Header commit={commit} saveState={saveState} />

      <main>
        <CapabilityGrid />

        <div className="import-row">
          <label className="file-button">
            Import notebook JSON
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => importJson(event.target.files?.[0])}
            />
          </label>
        </div>

        <div className="workspace-grid">
          <div className="primary-column">
            <ExperimentSetup
              experiment={experiment}
              onChange={updateExperiment}
              onNew={newExperiment}
              onExport={exportJson}
            />
            <SensorPanel
              readings={experiment.sensorReadings}
              importSummary={experiment.sensorImportSummary}
              onChange={updateReadings}
              onImportComplete={handleSensorImport}
            />
            <AnalysisPanel
              title={experiment.title}
              readings={primarySeries.readings}
              stats={stats}
              figureSvg={figureSvg}
            />
            <ReportPanel experiment={experiment} stats={stats} figureSvg={figureSvg} />
          </div>

          <aside className="side-column" aria-label="Capture tools">
            <VoicePanel
              notes={experiment.voiceNotes}
              onAddNote={addVoiceNote}
              onDeleteNote={deleteVoiceNote}
            />
            <ImagePanel
              images={experiment.imageMetadata}
              onAddImage={addImageMetadata}
              onDeleteImage={deleteImageMetadata}
            />
          </aside>
        </div>
      </main>
      <SavePill state={saveState} />
      <DebugOverlay experiment={experiment} />
    </div>
  );
}

function SavePill({ state }: { state: string }) {
  const lower = state.toLowerCase();
  const isError = lower.includes("fail") || lower.includes("error");
  const isSaving = lower === "saving" || lower.startsWith("loading");
  const tone = isError ? "error" : isSaving ? "saving" : "ok";
  return (
    <div
      className={`save-pill-mobile ${tone}`}
      role="status"
      aria-live="polite"
      aria-label={`Notebook state: ${state}`}
    >
      {state}
    </div>
  );
}
