import { Save, Trash2 } from "lucide-react";
import { Section } from "../../components/Section";
import type { Experiment } from "../../types";

interface ExperimentSetupProps {
  experiment: Experiment;
  onChange: (patch: Partial<Experiment>) => void;
  onNew: () => void;
  onExport: () => void;
}

const fields: Array<{
  key: keyof Pick<
    Experiment,
    | "title"
    | "question"
    | "hypothesis"
    | "independentVariable"
    | "dependentVariable"
    | "controls"
    | "materials"
    | "procedure"
    | "safetyNotes"
  >;
  label: string;
  multiline?: boolean;
}> = [
  { key: "title", label: "Experiment title" },
  { key: "question", label: "Research question", multiline: true },
  { key: "hypothesis", label: "Hypothesis", multiline: true },
  { key: "independentVariable", label: "Independent variable" },
  { key: "dependentVariable", label: "Dependent variable" },
  { key: "controls", label: "Controls", multiline: true },
  { key: "materials", label: "Materials", multiline: true },
  { key: "procedure", label: "Procedure", multiline: true },
  { key: "safetyNotes", label: "Safety notes", multiline: true },
];

export function ExperimentSetup({ experiment, onChange, onNew, onExport }: ExperimentSetupProps) {
  return (
    <Section
      title="Experiment Setup"
      eyebrow="Notebook"
      actions={
        <>
          <button className="ghost-button" type="button" onClick={onExport}>
            <Save size={16} aria-hidden="true" />
            Export JSON
          </button>
          <button className="ghost-button danger" type="button" onClick={onNew}>
            <Trash2 size={16} aria-hidden="true" />
            New
          </button>
        </>
      }
    >
      <div className="form-grid">
        {fields.map((field) => (
          <label className={field.multiline ? "field wide" : "field"} key={field.key}>
            <span>{field.label}</span>
            {field.multiline ? (
              <textarea
                value={String(experiment[field.key])}
                onChange={(event) => onChange({ [field.key]: event.target.value })}
                rows={field.key === "procedure" ? 4 : 3}
              />
            ) : (
              <input
                value={String(experiment[field.key])}
                onChange={(event) => onChange({ [field.key]: event.target.value })}
              />
            )}
          </label>
        ))}
      </div>
    </Section>
  );
}
