# 0048 Determinism and Reproducibility Guarantees

## Status

Accepted

## Context

Students and mentors need to rerun an import and trust that results are stable.

## Decision

Imported readings use deterministic IDs derived from source id, row number, and channel. Normalized output sorts deterministically. Report rendering accepts a fixed generation timestamp for tests. Exports include parse parameters, app version, schema version, and source hash.

## Consequences

Fixture outputs can be byte-identical. Reports become easier to inspect and reproduce.

## Alternatives Considered

Random IDs for imported readings were rejected for inferred data.
