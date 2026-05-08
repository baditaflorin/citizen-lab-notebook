# 0006 WASM Modules Used

## Status

Accepted

## Context

The project brief calls for Pyodide, matplotlib, SymPy, Whisper, local LLM-style report assistance, and ExifTool-style metadata extraction in a static browser app.

GitHub Pages cannot set custom COOP/COEP headers. The app therefore must lazy-load browser-compatible WASM/model packages that can run without custom headers, or degrade clearly when the browser cannot support them.

## Decision

Use these lazy capabilities:

- **Pyodide** from a pinned public CDN in a Web Worker for Python execution, NumPy, SymPy, and matplotlib figure rendering.
- **Transformers.js** in a Web Worker for local Whisper transcription and local text-generation/report drafting where the browser can run the selected models.
- **Browser image metadata extraction** with `exifr` for EXIF/IPTC/XMP fields. Native ExifTool is not bundled in v1 because the official native tool is not directly usable in a pure GitHub Pages runtime.

All heavy modules are loaded only after a user action and expose progress/errors in the UI.

## Consequences

- First load stays small.
- Users with capable devices can run local speech and text models without sending data to a server.
- Some model downloads are large and require patience on first use.
- Image metadata coverage is useful but not identical to native ExifTool.

## Alternatives Considered

- A Docker backend running Whisper/LLM/ExifTool was rejected by ADR 0001.
- Bundling model weights in the repository was rejected because it would make Pages publishing too heavy.
