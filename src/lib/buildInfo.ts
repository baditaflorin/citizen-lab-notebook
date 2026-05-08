export const appVersion = __APP_VERSION__;
export const buildCommit = __GIT_COMMIT__;
export const repositoryUrl = __REPOSITORY_URL__;
export const paypalUrl = __PAYPAL_URL__;

export interface CommitInfo {
  sha: string;
  url: string;
  source: "github-api" | "build";
}

export async function resolveCommitInfo(): Promise<CommitInfo> {
  const fallbackUrl = `${repositoryUrl}/commit/${buildCommit}`;

  try {
    const response = await fetch(
      "https://api.github.com/repos/baditaflorin/citizen-lab-notebook/commits/main",
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub commit lookup failed with ${response.status}`);
    }

    const payload = (await response.json()) as { sha?: string; html_url?: string };

    if (payload.sha && payload.html_url) {
      return {
        sha: payload.sha.slice(0, 7),
        url: payload.html_url,
        source: "github-api",
      };
    }
  } catch {
    // Build metadata remains useful offline or if the public API is rate limited.
  }

  return {
    sha: buildCommit,
    url: fallbackUrl,
    source: "build",
  };
}

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/citizen-lab-notebook/service-worker.js").catch(() => {
      // The app remains fully usable without the service worker.
    });
  });
}
