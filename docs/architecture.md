# Architecture

Citizen Lab Notebook is a Mode A static GitHub Pages app. There is no runtime backend, no hosted database, and no frontend secret.

## C4 Context

```mermaid
C4Context
  title Citizen Lab Notebook Context
  Person(student, "Student or amateur scientist", "Captures notes, data, photos, and reports")
  System(app, "Citizen Lab Notebook", "Static browser app served by GitHub Pages")
  System_Ext(github, "GitHub", "Hosts repository and Pages site")
  System_Ext(modelHub, "Public model/CDN hosts", "Optional lazy model and WASM downloads")
  System_Ext(usbSensor, "WebUSB sensor", "Local experiment device")

  Rel(student, app, "Uses in browser over HTTPS")
  Rel(app, github, "Loads static assets and fetches public commit metadata")
  Rel(app, modelHub, "Downloads Pyodide/model assets after user action")
  Rel(app, usbSensor, "Captures readings with browser WebUSB permission")
```

## C4 Container

```mermaid
C4Container
  title Citizen Lab Notebook Containers
  Person(student, "Student or amateur scientist")
  System_Boundary(pages, "GitHub Pages boundary") {
    Container(spa, "React/Vite SPA", "TypeScript, React", "Notebook UI, report generation, import/export")
    ContainerDb(indexedDb, "IndexedDB", "Browser storage", "Versioned local experiment documents")
    Container(pyodideWorker, "Pyodide worker", "Web Worker + WASM", "Python, SymPy, NumPy, matplotlib")
    Container(aiWorker, "Local AI worker", "Web Worker + Transformers.js", "Whisper transcription and local drafting where supported")
  }
  System_Ext(githubApi, "GitHub public API", "Latest main commit metadata")
  System_Ext(device, "WebUSB device", "Sensor readings")

  Rel(student, spa, "Creates notebooks")
  Rel(spa, indexedDb, "Saves locally")
  Rel(spa, pyodideWorker, "Runs analysis on demand")
  Rel(spa, aiWorker, "Runs local models on demand")
  Rel(spa, githubApi, "Fetches latest public commit SHA")
  Rel(spa, device, "Requests permission and reads data")
```

## Module Boundaries

- `src/features/experiments/` edits experiment setup and notebook identity.
- `src/features/voice/` records observations and talks to the local AI worker.
- `src/features/sensors/` imports CSV, generates demo data, and captures WebUSB readings.
- `src/features/analysis/` computes JavaScript stats, renders SVG figures, and runs Pyodide.
- `src/features/images/` extracts browser-readable EXIF/IPTC/XMP metadata.
- `src/features/report/` builds report sections and standalone HTML export.
- `src/lib/` contains storage, download, logging, and build metadata helpers.
- `src/workers/` isolates heavy Pyodide and model runtime work.

## Live Boundaries

Live app:

https://baditaflorin.github.io/citizen-lab-notebook/

Repository:

https://github.com/baditaflorin/citizen-lab-notebook
