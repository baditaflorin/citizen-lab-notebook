# 0049 Inspectability and Debug Surface

## Status

Accepted

## Context

Inference-heavy tools need explainability for support and trust.

## Decision

Add a `?debug=1` overlay that shows the current import summary, confidence, anomalies, skipped rows, activity log, and performance timings. Keep it out of the default flow.

## Consequences

Power users and maintainers can inspect why the app guessed something without adding permanent UI chrome.

## Alternatives Considered

Console-only debugging was rejected because users cannot attach console state to bug reports easily.
