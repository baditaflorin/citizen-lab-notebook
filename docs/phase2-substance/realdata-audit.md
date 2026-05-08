# Phase 2 Substance Real-Data Audit

Date: 2026-05-08

Scope: Citizen Lab Notebook v0.1.0, same Mode A GitHub Pages architecture. This audit covers the existing surface area only: experiment notes, voice/transcript notes, sensor CSV/WebUSB text ingestion, stats/figures, image metadata summaries, and report export.

## Fixture Candidates

These are the 10 real-world inputs Phase 2 should turn into committed fixtures after confirmation. They intentionally span clean, mildly messy, genuinely messy, broken, adversarial, huge, empty, partial, and weird encoding cases.

| ID  | Real-world input                                                                                                                                             | v1 happy-path behavior                                                                                                                                              | Should have done                                                                                                                 | Why v1 fails or feels brittle                                               | Failure style                                                                 | Manual work v1 pushes onto the user                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| R01 | Clean classroom CSV: `time,value,unit,label` rows from a spreadsheet.                                                                                        | Imports correctly, computes stats, renders figure, report includes count/mean/trend.                                                                                | Same, plus preserve source/provenance and confidence.                                                                            | Happy path only; no confidence, schema, or provenance attached to output.   | Mostly correct but under-explained.                                           | User must trust the app without seeing assumptions.            |
| R02 | Excel CSV with UTF-8 BOM, CRLF, quoted label containing a comma: `Time (s),Foam height (cm),"Trial, warm water"`.                                            | Header is detected, but each data row is split with naive `line.split(",")`; quoted commas shift fields and labels/units become wrong.                              | Parse RFC-style CSV, infer time/value/unit from headers, preserve quoted labels.                                                 | Parser is not a CSV parser; it is a comma splitter.                         | Wrong-but-confident when shifted rows still produce numeric first two fields. | User has to manually simplify labels or remove commas.         |
| R03 | European/Phyphox-style export using semicolon delimiters and decimal commas: `Time (s);Acceleration (m/s²)` then `0,10;9,81`.                                | Imports zero readings because parser only splits on commas, turning decimal commas into bogus columns.                                                              | Sniff delimiter, normalize decimal comma, infer units from headers.                                                              | No delimiter or locale inference.                                           | Obvious failure: "No valid CSV rows found."                                   | User has to convert delimiter and decimals in another tool.    |
| R04 | Vernier/Graphical Analysis style CSV with metadata preamble, units in header, and blank/comment lines before data.                                           | May import only rows whose first two comma-separated cells are numeric; metadata/header meaning is discarded.                                                       | Skip preamble, identify header row, infer units/labels, report skipped metadata as provenance.                                   | Header detection only checks the first line and cannot find a later header. | Silent partial import.                                                        | User has to delete preamble and manually label the dataset.    |
| R05 | Arduino Serial Plotter/log text: `temperature: 23.4 humidity: 51` or `23.4 51` repeated with no explicit time column.                                        | CSV paste usually imports zero readings; WebUSB parser treats first number as time and second as value, losing channel labels and inventing a misleading time axis. | Detect labeled channels, synthesize sample index/time when missing, create separate series or ask for the likely measured field. | No structure inference; assumes exactly one `time,value` pair.              | Wrong-but-confident for two-number lines.                                     | User has to reformat logs into `time,value`.                   |
| R06 | micro:bit or logger export with `sep=,`, timestamp/date column, and one or more sensor columns.                                                              | `sep=,` and header lines are treated as invalid data; later numeric rows may import, but date timestamps are rejected and multiple channels are ignored.            | Recognize `sep=`, parse date/time columns, infer channel columns, convert timestamps to elapsed seconds.                         | No dialect detection, date parsing, or multi-column strategy.               | Silent partial import or obvious zero-row failure depending on rows.          | User has to remove metadata and convert timestamps to seconds. |
| R07 | Messy student CSV with missing values, duplicate times, outlier typo, and comments: `120,9999,cm,# typo?`.                                                   | Imports numeric outlier as real, stats/regression/report treat it as valid, no anomaly warning.                                                                     | Surface anomalies: missing values skipped with count, duplicate times flagged, outlier marked low-confidence.                    | Stats are mathematically correct on bad data but domain-dumb.               | Wrong-but-confident.                                                          | User has to notice the graph/stat distortion manually.         |
| R08 | Huge sensor export: 100k to 1M rows pasted/uploaded from a phone sensor app.                                                                                 | Parser and stats run synchronously on the main thread; likely UI freeze, no progress, no cancel.                                                                    | Stream/chunk parse in a worker, show progress, support cancellation, document size budget.                                       | No performance budget or worker for parsing/stats.                          | Stuck or frozen state.                                                        | User has to wait blindly or reload and lose context.           |
| R09 | Empty/truncated/corrupted file: empty upload, half a CSV line, invalid bytes, or copied middle chunk without header.                                         | Empty returns no readings; partial numeric lines may import without warning; invalid text normalization is undefined.                                               | Say exactly what was recognized, what was skipped, and how to fix it. Preserve partial useful data with warnings.                | Boundary validation is too shallow; skipped rows are invisible.             | Obvious for empty, silent for partial.                                        | User has to guess whether data was lost.                       |
| R10 | Adversarial spreadsheet content: labels beginning with `=HYPERLINK(...)`, Unicode lookalikes, NBSP spaces, smart quotes, and CSV formula-injection payloads. | Import may accept labels; export writes labels back to CSV without formula neutralization unless a comma forces quoting.                                            | Normalize Unicode whitespace/quotes, neutralize spreadsheet formulas on export, mark suspicious labels.                          | No adversarial normalization or CSV safety policy.                          | Silent security/usability risk.                                               | User has to sanitize content before export.                    |

## Top 5 Logic Gaps

1. **CSV parsing is not real CSV parsing.** Quoted commas, embedded newlines, BOMs, comments, and dialect markers break or silently shift fields.
2. **No input dialect or schema inference.** The app assumes `time,value,unit,label`; it does not sniff delimiters, decimal style, header row, units, timestamps, or multiple sensor columns.
3. **Stats/report trust bad data too much.** Outliers, duplicate times, missing values, tiny samples, and partial imports flow into figures and conclusions without warnings or confidence.
4. **No provenance or reproducibility metadata in report/export.** Generated reports include a locale timestamp, but not parse settings, skipped-row counts, source identity, confidence, or deterministic generation metadata.
5. **Heavy parsing/analysis is synchronous and not cancellable.** Huge real exports can freeze the UI, and the user has no progress or safe abort path.

## Top 3 Intuition Failures

1. **"Upload CSV" looks general, but only one narrow CSV shape works.** A normal spreadsheet export with quoted labels or semicolon delimiters fails.
2. **Partial success is invisible.** If v1 imports 80 rows and silently skips 20, the user sees a chart and assumes all 100 rows were used.
3. **The report sounds more certain than the data deserves.** A report can state a trend from outlier-corrupted or tiny data without saying confidence is low.

## Top 3 "Feels Stupid" Moments

1. The user has to convert timestamps to numeric seconds even though the app should infer elapsed time.
2. The user has to delete preamble/comment rows and find the header row manually.
3. The user has to tell the app which columns are sensor values even when headers and units make it obvious.

## What "Smart" Means For This Product

1. Pasting or uploading a real sensor export should produce a useful preview immediately: detected rows, detected columns, units, skipped rows, and confidence.
2. The app should infer common lab-data shapes: elapsed-time table, timestamped logger export, multi-channel sensor table, Arduino serial log, and metadata-preamble CSV.
3. Every generated statistic, figure, and report claim should carry confidence and anomaly context when the input is messy.
4. The app should preserve the user's raw input assumptions as provenance so export -> re-import -> export is deterministic and inspectable.
5. Long-running local work should be honest: progress after 300 ms, cancellable after 5 s, and never a frozen notebook.

## Phase 2 Substance Success Metrics

- Real-data pass rate: at least 7 of the 10 real-world fixtures complete import -> preview -> stats -> report with no manual reformatting.
- No silent wrongness: 100% of skipped rows, inferred fields, low-confidence guesses, and anomalies are visible in UI and export metadata.
- Determinism: running each fixture twice produces byte-identical normalized output and report metadata except for explicitly versioned generation time fields, which must be stabilized in tests.
- Parser robustness: the 10 real-world fixtures plus 5 synthetic edge cases never throw uncaught exceptions.
- Performance: 100k-row CSV fixture reaches useful preview in under 2 seconds on the local test machine; any operation over 300 ms shows progress; any operation over 5 seconds is cancellable.
- Round-trip: exported notebook JSON re-imports to the same canonical state for all passing fixtures.

## Out Of Scope For Phase 2 Substance

- No new product surface area, navigation, dashboards, accounts, collaboration, cloud sync, classrooms, or backend.
- No visual polish, dark mode, command palette, OG images, onboarding tours, or marketing work.
- No architecture escalation beyond Mode A GitHub Pages.
- No new hardware-specific capture UI beyond making current CSV/WebUSB text ingestion smarter.
- No server-side Whisper, LLM, ExifTool, database, or Docker service.
- No Phase 3 polish work until the real-data pass rate and confidence/error behavior improve.
