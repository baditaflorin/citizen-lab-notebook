import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExperimentSetup } from "./ExperimentSetup";
import { createExperiment } from "../../types";

function renderSetup() {
  const onChange = vi.fn();
  const onNew = vi.fn();
  const onExport = vi.fn();
  render(
    <ExperimentSetup
      experiment={createExperiment()}
      onChange={onChange}
      onNew={onNew}
      onExport={onExport}
    />,
  );
  return { onChange, onNew, onExport };
}

describe("ExperimentSetup", () => {
  it("seeds every text field with a concrete real-world placeholder, never an empty string", () => {
    renderSetup();
    // The previous build shipped with no placeholders, so a stranger opening
    // a fresh notebook stared at nine empty inputs. Each placeholder must be
    // a sentence the user could plausibly write themselves.
    const placeholders = [
      /bean seeds sprout/i,
      /red, blue, and white light/i,
      /blue light will produce the tallest/i,
      /Colour of light over the seedlings/i,
      /Seedling height \(mm\)/i,
      /Same soil, same pot size/i,
      /12 bean seeds, 4 plastic pots/i,
      /Soak seeds for 12 h/i,
      /Adult supervision/i,
    ];
    for (const pattern of placeholders) {
      expect(screen.getByPlaceholderText(pattern), `placeholder ${pattern}`).toBeInTheDocument();
    }
  });

  it("hides hints by default and reveals them only when the help icon is pressed", () => {
    renderSetup();
    expect(screen.queryByText(/yes\/no opinion/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /what does "research question" mean/i }));
    expect(screen.getByText(/yes\/no opinion/i)).toBeInTheDocument();
  });

  it("collapses an open hint when its toggle is pressed a second time", () => {
    renderSetup();
    const toggle = screen.getByRole("button", { name: /what does "hypothesis" mean/i });
    fireEvent.click(toggle);
    expect(screen.getByText(/best guess BEFORE you start measuring/i)).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByText(/best guess BEFORE you start measuring/i)).not.toBeInTheDocument();
  });

  it("only allows one hint open at a time so the form stays compact on phones", () => {
    renderSetup();
    fireEvent.click(screen.getByRole("button", { name: /what does "controls" mean/i }));
    fireEvent.click(screen.getByRole("button", { name: /what does "materials" mean/i }));
    expect(screen.queryByText(/keep the same so it doesn't accidentally/i)).not.toBeInTheDocument();
    expect(screen.getByText(/recreate your setup from this alone/i)).toBeInTheDocument();
  });
});
