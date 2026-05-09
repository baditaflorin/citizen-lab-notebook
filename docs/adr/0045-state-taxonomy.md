# 0045 State Taxonomy and State Machine

## Status

Accepted

## Context

Long imports and recoverable failures need explicit UI states.

## Decision

Use explicit sensor import states: idle, parsing, imported, empty, recoverable-error, fatal-error, and cancelled. A newer import supersedes older results. Cancelling a worker import terminates the worker and preserves prior readings.

## Consequences

No import state should strand the user. Every state has retry, cancel, clear, or continue.

## Alternatives Considered

Single status strings were rejected because they hide concurrency and cancellation behavior.
