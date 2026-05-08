import { FlaskConical, Github, HeartHandshake, NotebookTabs } from "lucide-react";
import { appVersion, paypalUrl, repositoryUrl, type CommitInfo } from "../lib/buildInfo";

interface HeaderProps {
  commit: CommitInfo | null;
  saveState: string;
}

export function Header({ commit, saveState }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <FlaskConical size={24} />
        </div>
        <div>
          <p className="eyebrow">Browser science notebook</p>
          <h1>Citizen Lab Notebook</h1>
        </div>
      </div>

      <nav className="header-actions" aria-label="Project links">
        <a className="icon-link" href={repositoryUrl} target="_blank" rel="noreferrer">
          <Github size={18} aria-hidden="true" />
          Star repo
        </a>
        <a className="icon-link support" href={paypalUrl} target="_blank" rel="noreferrer">
          <HeartHandshake size={18} aria-hidden="true" />
          Support
        </a>
      </nav>

      <div className="build-strip" aria-label="Build metadata">
        <span>
          <NotebookTabs size={14} aria-hidden="true" /> v{appVersion}
        </span>
        <span>
          commit{" "}
          {commit ? (
            <a href={commit.url} target="_blank" rel="noreferrer">
              {commit.sha}
            </a>
          ) : (
            "loading"
          )}
        </span>
        <span>{saveState}</span>
      </div>
    </header>
  );
}
