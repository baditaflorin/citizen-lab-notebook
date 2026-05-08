import type { ReportInput } from "../report/report";

interface WorkerResponse {
  requestId: string;
  ok: boolean;
  result?: string;
  error?: string;
  status?: string;
}

let worker: Worker | undefined;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../../workers/aiWorker.ts", import.meta.url), { type: "module" });
  }

  return worker;
}

function requestWorker(
  type: "transcribe" | "draft",
  payload: unknown,
  onStatus: (message: string) => void,
): Promise<string> {
  const requestId = crypto.randomUUID();
  const aiWorker = getWorker();

  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.requestId !== requestId) {
        return;
      }

      if (event.data.status) {
        onStatus(event.data.status);
        return;
      }

      aiWorker.removeEventListener("message", handleMessage);

      if (event.data.ok && typeof event.data.result === "string") {
        resolve(event.data.result);
        return;
      }

      reject(new Error(event.data.error ?? "Local model request failed"));
    };

    aiWorker.addEventListener("message", handleMessage);
    aiWorker.postMessage({ type, requestId, payload });
  });
}

export function transcribeWithWhisper(
  blob: Blob,
  onStatus: (message: string) => void,
): Promise<string> {
  return requestWorker("transcribe", { blob }, onStatus);
}

export function draftWithLocalModel(
  input: ReportInput,
  onStatus: (message: string) => void,
): Promise<string> {
  return requestWorker(
    "draft",
    {
      title: input.experiment.title,
      question: input.experiment.question,
      hypothesis: input.experiment.hypothesis,
      stats: input.stats,
      notes: input.experiment.voiceNotes.map((note) => note.text).join("\n"),
    },
    onStatus,
  );
}
