import { analyzeSensorInput } from "../features/sensors/importer";

const workerSelf = self as DedicatedWorkerGlobalScope;

workerSelf.addEventListener("message", (event: MessageEvent) => {
  const { type, requestId, contents, sourceName } = event.data as {
    type: string;
    requestId: string;
    contents: string;
    sourceName: string;
  };

  if (type !== "import") {
    return;
  }

  try {
    workerSelf.postMessage({ requestId, status: "Reading sensor data" });
    const result = analyzeSensorInput(contents, { sourceName });
    workerSelf.postMessage({ requestId, ok: true, result });
  } catch (error) {
    workerSelf.postMessage({
      requestId,
      ok: false,
      error:
        error instanceof Error
          ? `Sensor import failed: ${error.message}. Check the file format or try a smaller excerpt.`
          : "Sensor import failed for an unknown reason. Try a smaller excerpt.",
    });
  }
});
