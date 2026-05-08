import { Calculator, FlaskConical, Sigma } from "lucide-react";
import { useState } from "react";
import { Section } from "../../components/Section";
import type { SensorReading } from "../../types";
import type { SummaryStats } from "./stats";
import { runPyodideAnalysis, type PyodideAnalysisResult } from "./pyodideClient";

interface AnalysisPanelProps {
  title: string;
  readings: SensorReading[];
  stats: SummaryStats;
  figureSvg: string;
}

function show(value: number | null): string {
  return value === null ? "n/a" : String(value);
}

export function AnalysisPanel({ title, readings, stats, figureSvg }: AnalysisPanelProps) {
  const [formula, setFormula] = useState("x**2 + 3*x + 2");
  const [status, setStatus] = useState("JavaScript stats are instant. Pyodide runs Python on demand.");
  const [pyodideResult, setPyodideResult] = useState<PyodideAnalysisResult | null>(null);

  async function runPython() {
    try {
      const result = await runPyodideAnalysis({ readings, formula, title }, setStatus);
      setPyodideResult(result);
      setStatus("Pyodide analysis complete");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Pyodide analysis failed");
    }
  }

  return (
    <Section title="Analysis" eyebrow="Stats, matplotlib, SymPy">
      <div className="stats-grid">
        <Stat label="n" value={String(stats.count)} />
        <Stat label="mean" value={show(stats.mean)} />
        <Stat label="median" value={show(stats.median)} />
        <Stat label="stdev" value={show(stats.standardDeviation)} />
        <Stat label="slope" value={show(stats.slope)} />
        <Stat label="R²" value={show(stats.rSquared)} />
      </div>

      <div className="figure-frame" dangerouslySetInnerHTML={{ __html: figureSvg }} />

      <div className="analysis-tools">
        <label className="field">
          <span>SymPy expression in x</span>
          <input value={formula} onChange={(event) => setFormula(event.target.value)} />
        </label>
        <button type="button" onClick={runPython}>
          <Sigma size={16} />
          Run Pyodide
        </button>
      </div>

      <p className="status-line">
        <FlaskConical size={14} /> {status}
      </p>

      {pyodideResult ? (
        <div className="python-result">
          <div>
            <h3>
              <Calculator size={16} /> Python result
            </h3>
            <p>
              mean={show(pyodideResult.pythonStats.mean)}, stdev=
              {show(pyodideResult.pythonStats.standardDeviation)}
            </p>
            {pyodideResult.symbolic ? (
              <p>
                d/dx {pyodideResult.symbolic.expression} = {pyodideResult.symbolic.derivative}
              </p>
            ) : null}
          </div>
          <div className="figure-frame compact" dangerouslySetInnerHTML={{ __html: pyodideResult.svg }} />
        </div>
      ) : null}
    </Section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
