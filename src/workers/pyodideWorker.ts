/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  PyodideAnalysisRequest,
  PyodideAnalysisResult,
} from "../features/analysis/pyodideClient";

const workerSelf = self as DedicatedWorkerGlobalScope & {
  loadPyodide?: (options: { indexURL: string }) => Promise<any>;
};

const pyodideUrl = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
let pyodidePromise: Promise<any> | undefined;

function postStatus(requestId: string, status: string): void {
  workerSelf.postMessage({ requestId, status });
}

async function getPyodide(requestId: string): Promise<any> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      postStatus(requestId, "Loading Pyodide runtime");
      if (!workerSelf.loadPyodide) {
        importScripts(`${pyodideUrl}pyodide.js`);
      }

      const pyodide = await workerSelf.loadPyodide?.({ indexURL: pyodideUrl });
      postStatus(requestId, "Loading Python packages");
      await pyodide.loadPackage(["numpy", "matplotlib", "sympy"]);
      return pyodide;
    })();
  }

  return pyodidePromise;
}

async function analyze(
  requestId: string,
  payload: PyodideAnalysisRequest,
): Promise<PyodideAnalysisResult> {
  const pyodide = await getPyodide(requestId);
  postStatus(requestId, "Running Python analysis");

  pyodide.globals.set("readings_json", JSON.stringify(payload.readings));
  pyodide.globals.set("formula_text", payload.formula);
  pyodide.globals.set("figure_title", payload.title);

  const resultJson = pyodide.runPython(`
import io
import json
import math
import numpy as np
import matplotlib
matplotlib.use("AGG")
import matplotlib.pyplot as plt
import sympy as sp

readings = json.loads(readings_json)
times = np.array([float(item["time"]) for item in readings], dtype=float)
values = np.array([float(item["value"]) for item in readings], dtype=float)

if len(values) == 0:
    mean = None
    stdev = None
else:
    mean = float(np.mean(values))
    stdev = float(np.std(values, ddof=1)) if len(values) > 1 else 0.0

symbolic = None
if formula_text.strip():
    x = sp.symbols("x")
    try:
        expr = sp.sympify(formula_text)
        symbolic = {
            "expression": str(sp.simplify(expr)),
            "derivative": str(sp.diff(expr, x)),
        }
    except Exception as exc:
        symbolic = {
            "expression": formula_text,
            "derivative": f"Could not differentiate: {exc}",
        }

fig, ax = plt.subplots(figsize=(7.2, 3.6), dpi=120)
if len(values) > 0:
    ax.plot(times, values, marker="o", color="#005f73", linewidth=2)
    if len(values) > 1:
        z = np.polyfit(times, values, 1)
        ax.plot(times, np.poly1d(z)(times), "--", color="#6d5bd0", linewidth=2)
else:
    ax.text(0.5, 0.5, "Add sensor data to render a Python figure", ha="center", va="center")
ax.set_title(figure_title)
ax.set_xlabel("Time")
ax.set_ylabel("Value")
ax.grid(True, alpha=0.25)
buf = io.StringIO()
fig.tight_layout()
fig.savefig(buf, format="svg")
plt.close(fig)

json.dumps({
    "pythonStats": {
        "count": int(len(values)),
        "mean": None if mean is None else round(mean, 4),
        "standardDeviation": None if stdev is None else round(stdev, 4),
    },
    "symbolic": symbolic,
    "svg": buf.getvalue(),
})
`);

  return JSON.parse(resultJson) as PyodideAnalysisResult;
}

workerSelf.addEventListener("message", (event: MessageEvent) => {
  const { type, requestId, payload } = event.data as {
    type: string;
    requestId: string;
    payload: PyodideAnalysisRequest;
  };

  if (type !== "analyze") {
    return;
  }

  analyze(requestId, payload)
    .then((result) => workerSelf.postMessage({ requestId, ok: true, result }))
    .catch((error: unknown) =>
      workerSelf.postMessage({
        requestId,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown Pyodide error",
      }),
    );
});
