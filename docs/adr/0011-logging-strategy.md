# 0011 Logging Strategy

## Status

Accepted

## Context

There is no server log stream in Mode A. Browser console output should help during development but should not be noisy in production.

## Decision

Use minimal structured console logging through a tiny browser logger. Production builds suppress routine debug output and only surface unexpected errors. User-facing failures go through inline status banners or toasts.

## Consequences

- Production console noise stays low.
- Errors remain visible to users without requiring devtools.
- There is no centralized telemetry by default.

## Alternatives Considered

- Remote logging was rejected because it would introduce a server-side collection surface and privacy concerns.
