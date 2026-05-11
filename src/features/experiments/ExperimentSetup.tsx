import { useState } from "react";
import { HelpCircle, Save, Trash2 } from "lucide-react";
import { Section } from "../../components/Section";
import type { Experiment } from "../../types";

interface ExperimentSetupProps {
  experiment: Experiment;
  onChange: (patch: Partial<Experiment>) => void;
  onNew: () => void;
  onExport: () => void;
}

interface FieldSpec {
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
  /** Visible placeholder example so users don't stare at an empty field. */
  placeholder: string;
  /** One-sentence "what does this mean?" expanded under the help icon. */
  hint: string;
}

const fields: FieldSpec[] = [
  {
    key: "title",
    label: "Experiment title",
    placeholder: "e.g., Does light colour change how fast bean seeds sprout?",
    hint: "A short name your teacher or parent could read on the cover of a science fair board.",
  },
  {
    key: "question",
    label: "Research question",
    multiline: true,
    placeholder:
      "e.g., If I water bean seeds under red, blue, and white light, which colour produces the tallest seedlings after 14 days?",
    hint: "Phrase it as a question you can actually answer with measurements, not a yes/no opinion.",
  },
  {
    key: "hypothesis",
    label: "Hypothesis",
    multiline: true,
    placeholder:
      "e.g., I predict blue light will produce the tallest seedlings because it has more energy per photon than red light.",
    hint: "Your best guess BEFORE you start measuring, plus the reason you think so.",
  },
  {
    key: "independentVariable",
    label: "Independent variable",
    placeholder: "e.g., Colour of light over the seedlings",
    hint: "The one thing YOU change between trials. There should only be one.",
  },
  {
    key: "dependentVariable",
    label: "Dependent variable",
    placeholder: "e.g., Seedling height (mm) measured after 14 days",
    hint: "The thing you measure. Include the unit so your data is self-explanatory.",
  },
  {
    key: "controls",
    label: "Controls",
    multiline: true,
    placeholder:
      "e.g., Same soil, same pot size, 25 ml of water every morning, 22°C room, 12-hour light cycle.",
    hint: "Everything you keep the same so it doesn't accidentally explain your results.",
  },
  {
    key: "materials",
    label: "Materials",
    multiline: true,
    placeholder:
      "e.g., 12 bean seeds, 4 plastic pots, potting soil, three 10 W LED lamps (red / blue / white), ruler.",
    hint: "List by quantity. A reader should be able to recreate your setup from this alone.",
  },
  {
    key: "procedure",
    label: "Procedure",
    multiline: true,
    placeholder:
      "e.g.,\n1. Soak seeds for 12 h.\n2. Plant 4 seeds per pot, 1 cm deep.\n3. Place each pot under one lamp.\n4. Water 25 ml at 08:00 daily.\n5. Measure tallest seedling per pot every evening for 14 days.",
    hint: "Numbered steps that another student could follow without asking you anything.",
  },
  {
    key: "safetyNotes",
    label: "Safety notes",
    multiline: true,
    placeholder:
      "e.g., Adult supervision when plugging in lamps. Wash hands after handling soil. Unplug lamps when leaving the room.",
    hint: "Anything sharp, hot, electrical, allergenic, or that needs an adult.",
  },
];

export function ExperimentSetup({ experiment, onChange, onNew, onExport }: ExperimentSetupProps) {
  const [openHint, setOpenHint] = useState<string | null>(null);

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
        {fields.map((field) => {
          const hintOpen = openHint === field.key;
          const hintId = `hint-${field.key}`;
          const inputId = `field-${field.key}`;
          return (
            <div className={field.multiline ? "field wide" : "field"} key={field.key}>
              <div className="field-label-row">
                <label htmlFor={inputId}>{field.label}</label>
                <button
                  type="button"
                  className="hint-toggle"
                  aria-expanded={hintOpen}
                  aria-controls={hintId}
                  aria-label={`What does "${field.label}" mean?`}
                  onClick={() => setOpenHint(hintOpen ? null : field.key)}
                >
                  <HelpCircle size={16} aria-hidden="true" />
                </button>
              </div>
              {hintOpen ? (
                <p id={hintId} className="field-hint">
                  {field.hint}
                </p>
              ) : null}
              {field.multiline ? (
                <textarea
                  id={inputId}
                  value={String(experiment[field.key])}
                  onChange={(event) => onChange({ [field.key]: event.target.value })}
                  rows={field.key === "procedure" ? 4 : 3}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  id={inputId}
                  value={String(experiment[field.key])}
                  onChange={(event) => onChange({ [field.key]: event.target.value })}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
