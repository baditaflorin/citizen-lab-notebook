# 0040 Real-Data Audit Findings and Substance Success Metrics

## Status

Accepted

## Context

The v0.1.0 app works on the curated `time,value,unit,label` demo, but real sensor exports contain dialect markers, quoted fields, locale decimals, metadata preambles, timestamps, missing values, outliers, multiple channels, and huge files.

## Decision

Use the 10 fixtures described in `docs/phase2-substance/realdata-audit.md` as the Phase 2 grading rubric. The primary success metric is at least 7/10 fixtures completing import, preview, stats, and report without manual reformatting. No fixture may silently lose data.

## Consequences

The parser and report logic must expose skipped rows, confidence, anomalies, and provenance. A clean happy path is not enough.

## Alternatives Considered

Continuing to support only the v1 CSV shape was rejected because it makes the app feel like a toy.
