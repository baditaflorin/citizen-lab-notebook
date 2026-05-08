# 0008 Go Backend Project Layout

## Status

Accepted

## Context

The bootstrap template specifies a Go backend layout for Mode B and Mode C. This project is Mode A and has no backend.

## Decision

Do not scaffold Go `cmd/`, `internal/`, `pkg/`, `api/`, `configs/`, or `deploy/` backend directories in v1.

## Consequences

- The repository remains smaller and easier to run locally.
- Backend hooks and Docker targets are omitted from the Makefile.
- Any future backend introduction must first revisit ADR 0001 and add a new architecture ADR.

## Alternatives Considered

- Adding an empty Go layout was rejected because it would imply a backend that does not exist.
