# 0017 Dependency Policy

## Status

Accepted

## Context

The app touches analysis, metadata extraction, storage, and local model execution. Custom implementations would increase risk.

## Decision

Use production-ready libraries for core concerns:

- React and Vite for the app shell.
- Zod for schema validation.
- `idb` for IndexedDB.
- `exifr` for browser image metadata extraction.
- Pyodide for Python, SymPy, NumPy, and matplotlib in-browser.
- Transformers.js for local Whisper and text-generation adapters.
- Vitest and Playwright for tests.

Dependencies are pinned through `package-lock.json`. `npm audit` must report no high or critical vulnerabilities before release.

## Consequences

- The codebase stays focused on product behavior.
- Upgrades are deliberate and reviewable.
- Heavy libraries must remain lazy-loaded to protect first-load size.

## Alternatives Considered

- Hand-written CSV/statistics code is allowed only for simple, testable calculations; specialized model and metadata parsing remain library-backed.
