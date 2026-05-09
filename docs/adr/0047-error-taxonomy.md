# 0047 Error Taxonomy and Messaging Guidelines

## Status

Accepted

## Context

Errors must preserve work and explain next steps.

## Decision

Classify errors as recoverable input errors, recoverable environment errors, cancelled operations, or fatal app errors. User-facing messages include what happened, why in domain terms, and now what.

## Consequences

Bad input does not replace good existing notebook data. Fatal errors remain rare and are handled by the global boundary.

## Alternatives Considered

Throwing raw exceptions into the UI was rejected.
