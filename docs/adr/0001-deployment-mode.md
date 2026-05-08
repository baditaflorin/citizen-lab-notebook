# 0001 Deployment Mode

## Status

Accepted

## Context

Citizen Lab Notebook needs to capture experiment notes, voice narration, sensor data, image metadata, calculations, figures, and a formatted report for students and amateur scientists. The bootstrap constraint is to default to GitHub Pages and avoid a runtime backend unless it is genuinely required.

The v1 workflow does not require shared accounts, server-side collaboration, private API keys, centralized storage, or cross-device sync. The heaviest features can be run locally in the browser:

- Pyodide loads Python, SymPy, NumPy, and matplotlib lazily in a Web Worker.
- Local speech and text models load lazily in a Web Worker where the browser/device can support them.
- WebUSB is exposed directly by Chromium-family browsers over HTTPS.
- Experiment state can persist in IndexedDB and OPFS-compatible browser storage.
- Report generation can be static HTML with print-to-PDF support.

## Decision

Use **Mode A: Pure GitHub Pages**.

The repository publishes a static Vite application from `main` branch `/docs`. There is no runtime server, no hosted database, and no frontend secret. Any large WASM/model assets are loaded lazily from public CDNs or model hubs only after a user action.

## Consequences

- The public attack surface is static GitHub Pages.
- Users keep notebook content in their own browser storage unless they explicitly export it.
- Hardware capture depends on browser support for WebUSB.
- Local AI quality and speed depend on the user's device and browser.
- GitHub Pages cannot set custom COOP/COEP headers, so WASM/model integrations must work without requiring custom response headers or must degrade gracefully.

## Alternatives Considered

- **Mode B: GitHub Pages + pre-built data** was rejected because v1 has no shared public dataset to precompute.
- **Mode C: GitHub Pages + Docker backend** was rejected because v1 does not require auth, secrets, server writes, real-time sync, or centralized computation.
