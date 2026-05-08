import { BrainCircuit, Download, FileText, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { Section } from "../../components/Section";
import { downloadText } from "../../lib/download";
import type { Experiment } from "../../types";
import type { SummaryStats } from "../analysis/stats";
import { draftWithLocalModel } from "../voice/aiClient";
import { buildReportSections, renderReportHtml } from "./report";

interface ReportPanelProps {
  experiment: Experiment;
  stats: SummaryStats;
  figureSvg: string;
}

export function ReportPanel({ experiment, stats, figureSvg }: ReportPanelProps) {
  const [aiDraft, setAiDraft] = useState("");
  const [status, setStatus] = useState("Report updates as the notebook changes.");
  const sections = useMemo(
    () => buildReportSections({ experiment, stats, figureSvg, aiDraft }),
    [experiment, stats, figureSvg, aiDraft],
  );
  const reportHtml = useMemo(
    () => renderReportHtml({ experiment, stats, figureSvg, aiDraft }),
    [experiment, stats, figureSvg, aiDraft],
  );

  async function runLocalDraft() {
    try {
      const draft = await draftWithLocalModel({ experiment, stats, figureSvg }, setStatus);
      setAiDraft(draft);
      setStatus("Local model draft added to the abstract");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Local model drafting failed");
    }
  }

  function printReport() {
    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      downloadText(
        `${experiment.title || "lab-report"}.html`,
        reportHtml,
        "text/html;charset=utf-8",
      );
      setStatus("Popup blocked. Downloaded the report HTML instead.");
      return;
    }

    reportWindow.opener = null;
    reportWindow.document.write(reportHtml);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  }

  return (
    <Section
      title="Lab Report"
      eyebrow="Generated output"
      actions={
        <>
          <button className="ghost-button" type="button" onClick={runLocalDraft}>
            <BrainCircuit size={16} />
            Local draft
          </button>
          <button className="ghost-button" type="button" onClick={printReport}>
            <Printer size={16} />
            Print/PDF
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() =>
              downloadText(
                `${experiment.title || "lab-report"}.html`,
                reportHtml,
                "text/html;charset=utf-8",
              )
            }
          >
            <Download size={16} />
            HTML
          </button>
        </>
      }
    >
      <p className="status-line">
        <FileText size={14} /> {status}
      </p>
      <article className="report-preview">
        <h3>{experiment.title}</h3>
        <div className="figure-frame compact" dangerouslySetInnerHTML={{ __html: figureSvg }} />
        {sections.map((section) => (
          <section key={section.id}>
            <h4>{section.title}</h4>
            <p>{section.body}</p>
          </section>
        ))}
      </article>
    </Section>
  );
}
