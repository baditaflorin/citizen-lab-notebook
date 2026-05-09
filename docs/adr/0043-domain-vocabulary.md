# 0043 Domain Vocabulary and UI Language

## Status

Accepted

## Context

Errors like "undefined" or "parse failed" do not help a student fix a lab dataset.

## Decision

Use lab-data vocabulary: rows, readings, sensor channel, timestamp, elapsed time, unit, skipped row, outlier, duplicate time, confidence, and source format. Error messages must say what failed, why, and the next step.

## Consequences

The app sounds like a lab assistant, not a parser library.

## Alternatives Considered

Developer-centric terms such as token, AST, candidate, or schema mismatch are rejected for user-facing copy.
