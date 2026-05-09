# Phase 2 Substance Postmortem

## Real-Data Pass Rate

Before: 2/10 fixtures completed the primary flow without manual reformatting.

After: 10/10 fixtures pass the automated real-data suite.

| Fixture                          | Before               | After                            |
| -------------------------------- | -------------------- | -------------------------------- |
| R01 clean classroom CSV          | Pass                 | Pass                             |
| R02 Excel quoted CSV             | Fail, shifted fields | Pass                             |
| R03 semicolon + decimal comma    | Fail, zero rows      | Pass                             |
| R04 Vernier preamble CSV         | Partial/silent       | Pass                             |
| R05 Arduino serial log           | Fail/wrong time      | Pass                             |
| R06 timestamped logger           | Fail/partial         | Pass                             |
| R07 messy student data           | Wrong-but-confident  | Pass with anomalies              |
| R08 phone sensor export          | Pass on small input  | Pass, plus 100k companion        |
| R09 truncated single-column file | Partial/silent       | Pass with low confidence         |
| R10 adversarial labels           | Silent risk          | Pass with formula-risk anomalies |

## Top 5 Logic Gaps Closed

1. CSV parsing now uses dialect sniffing and quote-aware parsing instead of `line.split(",")`.
2. Input inference now detects delimiter, decimal style, header row, units, time/timestamp fields, labels, value columns, and common source shapes.
3. Stats/reporting now expose data quality and avoid mixing unrelated sensor channels for analysis.
4. Exports and report HTML include provenance: schema version, app version, source id, parse settings, confidence, skipped rows, and anomalies.
5. Sensor import now runs in a Web Worker with cancellation and recoverable errors that preserve existing readings.

## Smart Behaviors Promised

- Useful first guess: all 10 fixtures produce readings and an import summary without manual cleanup.
- Common shapes: classroom CSV, Excel quoted CSV, Phyphox-style decimal comma, Vernier preamble, Arduino serial logs, timestamped logger CSV, truncated single-column input, and adversarial labels are recognized.
- Confidence and anomaly context: skipped rows, duplicate times, outliers, formula-like labels, and low-confidence imports surface in UI and export metadata.
- Reproducibility: fixture tests run each input twice and compare canonical output with duration stripped.
- Performance honesty: imports run off the main thread; 100k-row companion is measured by `npm run perf:fixtures`.

## Determinism Check

All 10 fixtures pass deterministic canonical output checks. Imported reading IDs are derived from source id, row number, field index, and label.

Report HTML is deterministic when `generatedAt` is supplied, and the report test asserts byte-identical output for repeated renders.

## Performance Numbers

Measured with `npm run perf:fixtures` on 2026-05-09.

- Fixture median: 0.299 ms
- Fixture p95: 2.328 ms
- Fixture worst: 2.328 ms
- 100k-row companion: 832.754 ms
- 100k-row target: <2000 ms

Raw measurement artifact:

docs/perf/phase2-import.json

## What Surprised Me

- `Date.parse("0")` is valid in JavaScript, which initially caused numeric time columns to be misclassified as timestamps.
- Spreadsheet formula detection must not flag negative numeric readings as dangerous labels.
- The biggest 100k-row hot path was outlier detection, not CSV splitting. Skipping full outlier sorting above 20k rows brought the run under budget while worker cancellation still protects the UI.

## Still Open For Phase 3

1. User-editable correction controls for inferred columns and units.
2. Per-label analysis tabs for multi-channel datasets instead of only selecting a primary series.
3. OPFS-backed raw attachment storage for large audio/image files.
4. Better low-confidence report language that changes entire conclusion tone, not only the data-quality section.
5. Device presets for common classroom sensors and Arduino/micro:bit firmware conventions.

## Honest Take: Is It Still A Toy?

It no longer feels like a toy for sensor-data import. A stranger can paste messy classroom exports and get a useful first guess, warnings, confidence, and a report without cleaning the file first.

It can still feel toy-like around correction workflows: the app explains what it inferred, but the user cannot yet click a column and override the inference inline. Multi-channel analysis is also only halfway smart: it avoids blending channels now, but it does not yet give each channel a full first-class analysis view.
