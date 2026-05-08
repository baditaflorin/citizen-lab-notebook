# 0007 Data Generation Pipeline

## Status

Accepted

## Context

Mode B would require a local or scheduled data-generation pipeline that writes committed or release-hosted artifacts. This project is Mode A.

## Decision

Do not create a data-generation pipeline in v1.

## Consequences

- `make data` is intentionally omitted.
- All experiment data is user-created in the browser or imported locally.
- Adding shared fixtures or public datasets later requires a new ADR.

## Alternatives Considered

- A sample-data generator was considered but kept inside the frontend as deterministic demo data rather than a backend pipeline.
