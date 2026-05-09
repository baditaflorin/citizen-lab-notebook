# Phase 2 Substance Plan

Status: accepted for implementation after the §0 audit.

Goal: make the existing notebook surface understand messy real lab data before adding any new feature or polish.

## Ranked Items

1. **A1 Fuzz parser with real fixtures and synthetic edge cases.** User impact: every crash or silent skip destroys trust.
2. **B6 Auto-detect structure.** Infer delimiter, header row, time column, value columns, unit hints, and source shape.
3. **B8 Useful first guess on first input.** Import should immediately produce readings, warnings, and confidence.
4. **A2 Encoding and format variants.** Normalize BOM, CRLF/LF, NBSP, smart quotes, and decimal comma.
5. **A5 Adversarial input.** Handle quoted CSV, embedded commas/newlines, formula-like labels, comments, and malformed rows.
6. **C15 Domain conventions.** Sniff delimiters, skip metadata preamble, respect units in headers, and normalize timestamps.
7. **C13 Recognize common shapes.** Classroom CSV, Excel export, Phyphox-style export, Vernier preamble CSV, Arduino serial logs, timestamped loggers.
8. **B7 Auto-classify fields.** Infer time/timestamp/value/text/metadata columns with reasons.
9. **B9 Normalize formats.** Dates to elapsed seconds, decimal comma to numeric, whitespace collapsed, units extracted.
10. **D18 Surface anomalies.** Missing values, duplicate times, outliers, skipped rows, and mixed schemas are visible.
11. **D16 Confidence scores.** Every inference and import has confidence.
12. **D19 Explain decisions.** Imported data carries decision reasons.
13. **H32 Actionable errors.** What failed, why it happened, and the next step.
14. **H33 Validate at boundaries.** Parse and schema errors localize to the input.
15. **H34 Recoverable vs fatal.** Bad imports keep prior notebook state.
16. **I35 Deterministic outputs.** Same fixture produces byte-identical canonical output.
17. **I38 Output provenance.** Exports include source id, app version, schema version, parse settings, and confidence.
18. **E21 Lossless round-trip.** Notebook JSON export and import preserve canonical state.
19. **E22 Stable IDs.** Imported readings have deterministic IDs.
20. **F24 Enumerate states.** Document and implement import/save/error states.
21. **F25 No stuck states.** Every import state exits through success, cancel, retry, or clear.
22. **F26 Cancellation actually cancels.** Worker import can be aborted without mutating data.
23. **F27 Concurrency safety.** A newer import supersedes older import results.
24. **G29 Heavy work off main thread.** Sensor import runs in a Web Worker.
25. **G31 Cache expensive things.** Stats/figure derivation remains memoized by readings.
26. **G28 Profile real fixtures.** Measure median, p95, worst parse times.
27. **A3 Huge inputs.** Define 100k-row budget and test it.
28. **A4 Partial inputs.** Preserve usable rows and explain skipped rows.
29. **I36 Inspectable history.** Import/export actions append an activity log.
30. **I37 Debug overlay.** `?debug=1` reveals state, confidence, anomalies, and timings.
31. **C14 Domain-aware export.** Report/notebook export includes import summary and confidence.

## Implementation Order

1. Fixtures and expected outputs.
2. Pure robust parser/inference engine.
3. Worker client, cancellation, and UI state handling.
4. Deterministic report/export provenance.
5. Debug/history/performance measurements.
6. Postmortem and v0.2.0 release.
