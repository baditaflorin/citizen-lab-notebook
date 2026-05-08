/* eslint-disable @typescript-eslint/no-explicit-any */
const workerSelf = self as DedicatedWorkerGlobalScope;

type PipelineFactory = (
  task: string,
  model: string,
  options?: Record<string, unknown>,
) => Promise<any>;

interface TransformersModule {
  pipeline: PipelineFactory;
  env: {
    allowLocalModels?: boolean;
    allowRemoteModels?: boolean;
    useBrowserCache?: boolean;
  };
}

let transformersPromise: Promise<TransformersModule> | undefined;
let whisperPipeline: any;
let textPipeline: any;

function postStatus(requestId: string, status: string): void {
  workerSelf.postMessage({ requestId, status });
}

async function getTransformers(requestId: string): Promise<TransformersModule> {
  if (!transformersPromise) {
    transformersPromise = (async () => {
      postStatus(requestId, "Loading local model runtime");
      const mod = (await import("@huggingface/transformers")) as unknown as TransformersModule;
      mod.env.allowLocalModels = false;
      mod.env.allowRemoteModels = true;
      mod.env.useBrowserCache = true;
      return mod;
    })();
  }

  return transformersPromise;
}

async function transcribe(requestId: string, blob: Blob): Promise<string> {
  const { pipeline } = await getTransformers(requestId);

  if (!whisperPipeline) {
    postStatus(requestId, "Downloading Whisper tiny model");
    whisperPipeline = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
  }

  postStatus(requestId, "Transcribing audio locally");
  const url = URL.createObjectURL(blob);

  try {
    const result = (await whisperPipeline(url, {
      chunk_length_s: 30,
      stride_length_s: 5,
    })) as { text?: string };

    return result.text?.trim() || "No speech was detected in the recording.";
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function draft(requestId: string, payload: Record<string, unknown>): Promise<string> {
  const { pipeline } = await getTransformers(requestId);

  if (!textPipeline) {
    postStatus(requestId, "Downloading local text model");
    textPipeline = await pipeline("text-generation", "HuggingFaceTB/SmolLM2-135M-Instruct");
  }

  const prompt = `Write a concise science fair lab report abstract. Use only these notes.
Title: ${payload.title}
Question: ${payload.question}
Hypothesis: ${payload.hypothesis}
Stats: ${JSON.stringify(payload.stats)}
Observations: ${payload.notes}`;

  postStatus(requestId, "Drafting report locally");
  const result = (await textPipeline(prompt, {
    max_new_tokens: 180,
    temperature: 0.3,
    do_sample: false,
  })) as Array<{ generated_text?: string }> | { generated_text?: string };

  const text = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;
  const cleaned = (text ?? "").replace(prompt, "").trim();

  return cleaned || deterministicDraft(payload);
}

function deterministicDraft(payload: Record<string, unknown>): string {
  return `${payload.title} investigates ${payload.question}. The current notebook combines narrated observations with sensor statistics so the experiment can be reviewed, graphed, and repeated.`;
}

workerSelf.addEventListener("message", (event: MessageEvent) => {
  const { type, requestId, payload } = event.data as {
    type: "transcribe" | "draft";
    requestId: string;
    payload: { blob?: Blob } | Record<string, unknown>;
  };

  const task =
    type === "transcribe"
      ? transcribe(requestId, (payload as { blob: Blob }).blob)
      : draft(requestId, payload as Record<string, unknown>);

  task
    .then((result) => workerSelf.postMessage({ requestId, ok: true, result }))
    .catch((error: unknown) =>
      workerSelf.postMessage({
        requestId,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "The local model could not complete the request on this device.",
      }),
    );
});
