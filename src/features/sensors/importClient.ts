import type { SensorImportResult } from "./importer";

interface WorkerStatus {
  requestId: string;
  status?: string;
  ok?: boolean;
  result?: SensorImportResult;
  error?: string;
}

export interface SensorImportTask {
  requestId: string;
  promise: Promise<SensorImportResult>;
  cancel: () => void;
}

export function startSensorImport(
  contents: string,
  sourceName: string,
  onStatus: (status: string) => void,
): SensorImportTask {
  const requestId = crypto.randomUUID();
  const worker = new Worker(new URL("../../workers/sensorImportWorker.ts", import.meta.url), {
    type: "module",
  });

  const promise = new Promise<SensorImportResult>((resolve, reject) => {
    const handleMessage = (event: MessageEvent<WorkerStatus>) => {
      if (event.data.requestId !== requestId) {
        return;
      }

      if (event.data.status) {
        onStatus(event.data.status);
        return;
      }

      worker.removeEventListener("message", handleMessage);
      worker.terminate();

      if (event.data.ok && event.data.result) {
        resolve(event.data.result);
        return;
      }

      reject(new Error(event.data.error ?? "Sensor import failed."));
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", (event) => {
      worker.terminate();
      reject(new Error(event.message));
    });
    worker.postMessage({ type: "import", requestId, contents, sourceName });
  });

  return {
    requestId,
    promise,
    cancel: () => worker.terminate(),
  };
}
