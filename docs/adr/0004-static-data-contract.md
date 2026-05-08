# 0004 Static Data Contract

## Status

Accepted

## Context

Mode A has no backend and no shared pre-built dataset. The main data contract is the user's local experiment record and exported report bundle.

## Decision

Use a versioned local experiment schema validated with Zod. The v1 schema contains:

- experiment identity, title, question, hypothesis, variables, materials, and procedure
- timestamped voice notes and transcripts
- sensor readings as `{ time, value, unit, label }`
- analysis results and generated SVG figures
- image metadata summaries
- generated report sections

Exports are stable JSON and standalone HTML. Breaking schema changes bump `schemaVersion`.

## Consequences

- Users can archive and move their notebook without a server.
- IndexedDB records and exported JSON share the same validation path.
- Future import migrations must be explicit.

## Alternatives Considered

- Static `/data/*.json` artifacts were rejected because there is no shared dataset in v1.
- A hosted API contract was rejected by ADR 0001.
