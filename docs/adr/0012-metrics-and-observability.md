# 0012 Metrics and Observability

## Status

Accepted

## Context

Mode A has no server-side metrics. The user base may include minors and school projects, so privacy should be conservative.

## Decision

Do not add analytics in v1. Provide visible app health/status for local capabilities instead: storage availability, WebUSB support, speech recognition support, Pyodide readiness, and local model readiness.

## Consequences

- No PII or behavior analytics are collected.
- Product usage must be inferred from direct feedback, GitHub stars/issues, or voluntary reports.
- Adding analytics later requires a privacy ADR and `docs/privacy.md` update.

## Alternatives Considered

- Plausible analytics was considered but rejected for v1 to keep the privacy model simple.
