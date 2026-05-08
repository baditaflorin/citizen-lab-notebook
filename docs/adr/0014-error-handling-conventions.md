# 0014 Error Handling Conventions

## Status

Accepted

## Context

Browser APIs fail for ordinary reasons: unsupported hardware, missing permissions, denied microphone access, model downloads, and storage quotas. Failures should be clear and recoverable.

## Decision

Use typed result objects for feature operations that commonly fail. Convert unknown exceptions into friendly messages at feature boundaries. Show inline status banners and preserve user-entered data whenever possible.

Worker messages use explicit `type`, `requestId`, `ok`, `result`, and `error` fields.

## Consequences

- Users get actionable failure states.
- Tests can assert error messages without depending on thrown browser exceptions.
- Unexpected errors still reach the global error boundary.

## Alternatives Considered

- Letting exceptions bubble directly to React was rejected because it would lose context and risk data loss.
