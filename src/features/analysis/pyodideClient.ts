import type { SensorReading } from "../../types";

export interface PyodideAnalysisRequest {
  readings: SensorReading[];
  formula: string;
  title: string;
}

export interface PyodideAnalysisResult {
  pythonStats: {
    count: number;
    mean: number | null;
    standardDeviation: number | null;
  };
  symbolic: {
    expression: string;
    derivative: string;
  } | null;
  svg: string;
}

interface WorkerResponse {
  requestId: string;
  ok: boolean;
  result?: PyodideAnalysisResult;
  error?: string;
}

let worker: Worker | undefined;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../../workers/pyodideWorker.ts", import.meta.url), {
      type: "module",
    });
  }

  return worker;
}

export function runPyodideAnalysis(
  request: PyodideAnalysisRequest,
  onStatus: (message: string) => void,
): Promise<PyodideAnalysisResult> {
  const requestId = crypto.randomUUID();
  const pyodideWorker = getWorker();

  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<WorkerResponse | { requestId: string; status: string }>) => {
      if (event.data.requestId !== requestId) {
        return;
      }

      if ("status" in event.data) {
        onStatus(event.data.status);
        return;
      }

      pyodideWorker.removeEventListener("message", handleMessage);

      if (event.data.ok && event.data.result) {
        resolve(event.data.result);
        return;
      }

      reject(new Error(event.data.error ?? "Pyodide analysis failed"));
    };

    pyodideWorker.addEventListener("message", handleMessage);
    pyodideWorker.postMessage({ type: "analyze", requestId, payload: request });
  });
}
