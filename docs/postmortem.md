# Postmortem

## What Was Built

Citizen Lab Notebook v0.1.0 is a static GitHub Pages science notebook. It includes experiment setup, local browser persistence, voice observations, audio recording, optional local Whisper transcription, CSV/sample/WebUSB sensor data, statistics, SVG figures, Pyodide/matplotlib/SymPy analysis on demand, browser image metadata extraction, report generation, print-to-PDF, HTML/JSON export, PWA assets, visible version/commit metadata, GitHub star link, and PayPal support link.

Live app:

https://baditaflorin.github.io/citizen-lab-notebook/

Repository:

https://github.com/baditaflorin/citizen-lab-notebook

## Was Mode A Correct?

Yes. Mode A was the right call for v1. The core notebook, analysis, import/export, and report workflow all work as a static app with IndexedDB and browser APIs. A runtime backend would mainly add hosting, privacy, and operational cost without solving a v1 requirement.

The only caveat is native ExifTool parity. A pure Pages app can extract useful EXIF/IPTC/XMP metadata with `exifr`, but it cannot bundle the native ExifTool executable cleanly. That limitation is documented in ADR 0006.

## What Worked

- GitHub Pages from `main` `/docs` was simple and publishable from the first commit.
- Lazy workers kept the first-load app bundle under the 200 KB gzip target even with local AI support available on demand.
- Plain `.githooks/` were easy to audit and caught a real generated-asset formatting issue.
- Playwright smoke testing against the real `/citizen-lab-notebook/` base path caught a local preview bug before publish.

## What Did Not Work Smoothly

- The machine was almost out of disk space; clearing npm cache was required before git could write the index.
- Vite worker output needed `worker.format = "es"` because the local AI worker code-splits.
- The first smoke server port was already in use, so scripts now choose a free local port.

## Surprises

- Transformers.js pulls an ONNX WASM asset of about 21 MB. It is lazy and not part of first load, but it is still a visible repository/build artifact.
- GitHub Pages commit metadata is best shown with a public GitHub API fetch at runtime, because a static build cannot know the hash of the commit that will contain its own generated output.

## Accepted Tech Debt

- Local LLM/Whisper model selection is conservative and may need tuning for speed and browser compatibility.
- WebUSB parsing is generic line-based capture; real classroom sensors may need device-specific adapters.
- Raw audio is temporary only; long-term media storage in OPFS is deferred.
- The report generator is useful but still template-forward when local text generation is unavailable.

## Next Three Improvements

1. Add device presets for common Arduino, micro:bit, Vernier-style, and CircuitPython sensor formats.
2. Add OPFS-backed media attachments with explicit user controls for storage size and deletion.
3. Add report templates for biology, chemistry, physics, and environmental science fairs.

## Time Spent vs Estimate

Estimated: 3 to 5 focused hours for a strong v1 scaffold and working app.

Actual: about 2 hours in this session, helped by keeping the architecture static and avoiding backend/container work.
