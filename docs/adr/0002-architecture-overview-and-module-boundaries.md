# 0002 Architecture Overview and Module Boundaries

## Status

Accepted

## Context

The application must stay static while still feeling like a serious lab notebook. It needs UI state, local persistence, sensor capture, image metadata extraction, Python-backed analysis, local AI assistance, and report generation.

## Decision

Use feature-oriented frontend modules:

- `features/experiments` owns experiment editing and persistence workflows.
- `features/sensors` owns CSV import, sample data, and WebUSB capture.
- `features/analysis` owns JavaScript statistics, SVG figures, and Pyodide orchestration.
- `features/voice` owns browser recording, speech recognition, and Whisper worker requests.
- `features/images` owns image import and metadata extraction.
- `features/report` owns deterministic report generation, AI drafting, and export.
- `workers` owns isolated Pyodide and AI/model execution.
- `lib` owns storage, version metadata, and shared utility functions.

## Consequences

- Browser-only constraints stay visible at module boundaries.
- Heavy dependencies can remain lazy-loaded behind worker messages.
- Tests can target pure logic modules without booting the full app.

## Alternatives Considered

- A route-heavy app was rejected because v1 is a focused workspace rather than a multipage product.
- A single large component was rejected because it would make hardware and worker failures harder to isolate.
