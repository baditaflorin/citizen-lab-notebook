# 0042 Inference Engine

## Status

Accepted

## Context

The app currently assumes one schema. Real inputs need structure inference with confidence and reasons.

## Decision

Implement a deterministic sensor import engine that infers source shape, header row, delimiter, decimal style, time column, value columns, units, skipped rows, and anomalies. The engine returns readings plus an import summary; it never mutates app state directly.

## Consequences

UI and tests can rely on a pure result object. New device-specific strategies can be added without changing the app shell.

## Alternatives Considered

Model-based inference was rejected for this phase because deterministic rule-based inference is faster, testable, and offline.
