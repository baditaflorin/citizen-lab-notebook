# 0046 Performance Budgets and Measurement Plan

## Status

Accepted

## Context

Real sensor exports can be large enough to freeze the main thread.

## Decision

Sensor import runs in a Web Worker. The target for a 100k-row CSV is useful preview in under 2 seconds on the local test machine. Operations over 300 ms show progress; operations over 5 seconds are cancellable. Fixture tests record parse durations for median, p95, and worst-case postmortem numbers.

## Consequences

The UI stays responsive while parsing. Performance regressions can be detected with fixture measurements.

## Alternatives Considered

Main-thread parsing was rejected for huge inputs.
