# 0044 Confidence Model

## Status

Accepted

## Context

No silent wrongness means the app must reveal when it is guessing.

## Decision

Represent confidence as a number from 0 to 1 and a label: high, medium, or low. Inference confidence is based on evidence: explicit headers, consistent row widths, numeric parse rate, timestamp consistency, unit hints, skipped-row rate, and anomaly count.

## Consequences

Reports and exports can carry confidence metadata. Low confidence results remain usable but are visibly marked for review.

## Alternatives Considered

Binary valid/invalid was rejected because messy data is often partially useful.
