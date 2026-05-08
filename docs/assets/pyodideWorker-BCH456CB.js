const i=self,r="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";let n;function l(s,t){i.postMessage({requestId:s,status:t})}async function d(s){return n||(n=(async()=>{var e;l(s,"Loading Pyodide runtime"),i.loadPyodide||importScripts(`${r}pyodide.js`);const t=await((e=i.loadPyodide)==null?void 0:e.call(i,{indexURL:r}));return l(s,"Loading Python packages"),await t.loadPackage(["numpy","matplotlib","sympy"]),t})()),n}async function p(s,t){const e=await d(s);l(s,"Running Python analysis"),e.globals.set("readings_json",JSON.stringify(t.readings)),e.globals.set("formula_text",t.formula),e.globals.set("figure_title",t.title);const o=e.runPython(`
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
`);return JSON.parse(o)}i.addEventListener("message",s=>{const{type:t,requestId:e,payload:o}=s.data;t==="analyze"&&p(e,o).then(a=>i.postMessage({requestId:e,ok:!0,result:a})).catch(a=>i.postMessage({requestId:e,ok:!1,error:a instanceof Error?a.message:"Unknown Pyodide error"}))});
