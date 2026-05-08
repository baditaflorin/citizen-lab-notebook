# 0010 GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live URL is a first-class deliverable. GitHub Pages must serve a working site from the beginning, and the built frontend must be committed to the repository. The repository also needs predictable rollback by reverting a publishing commit.

GitHub Pages supports serving a branch root or `/docs` folder. This project also needs source files, tests, local hooks, and scripts in the repository root.

## Decision

Serve GitHub Pages from the `main` branch `/docs` directory:

https://baditaflorin.github.io/citizen-lab-notebook/

The Vite production build writes to `docs/`. The app uses the base path `/citizen-lab-notebook/`, hashed assets, and a copied `404.html` fallback for SPA routing. The `docs/` directory is intentionally tracked and is not ignored by `.gitignore`.

## Consequences

- A normal `git push origin main` publishes both source and the current static build.
- Rollback is a normal `git revert`.
- Pull requests and local changes can review the exact static output that Pages will serve.
- The app must avoid assumptions that GitHub Pages supports `_headers` or `_redirects`.
- Service worker scope must stay under `/citizen-lab-notebook/`.

## Alternatives Considered

- **`gh-pages` branch** would keep built output separate but add branch-management overhead.
- **`main` branch root** would mix generated assets with source files.
- **GitHub Actions Pages deploy** was rejected because project checks and publishing are intentionally local, not GitHub Actions based.
