# 0015 Deployment Topology

## Status

Accepted

## Context

Mode C would require Docker Compose, nginx, TLS, metrics, and runtime backend deployment. This project is Mode A.

## Decision

Use GitHub Pages only:

- Source and built output live in the same repository.
- Pages serves `main` branch `/docs`.
- There is no `deploy/` directory, Dockerfile, nginx config, Prometheus, or backend port.

## Consequences

- Operational overhead is minimal.
- Rollback is a Git revert.
- Runtime server concerns are explicitly out of scope for v1.

## Alternatives Considered

- Docker backend topology was rejected by ADR 0001.
