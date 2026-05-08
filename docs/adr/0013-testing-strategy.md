# 0013 Testing Strategy

## Status

Accepted

## Context

The app has pure logic, browser APIs, workers, and a generated static build. Tests should run locally through Makefile targets and git hooks.

## Decision

Use:

- Vitest for unit tests of statistics, report generation, schema validation, and storage helpers.
- Playwright for one browser happy path against the built `docs/` site.
- `scripts/smoke.sh` to build, serve `docs/`, and run the Playwright smoke test.

Coverage target is at least 70% for logic modules where coverage is meaningful. Heavy WASM/model initialization is covered by UI capability checks and graceful failure paths rather than full model execution in hooks.

## Consequences

- Local hooks stay fast enough for pre-push.
- Critical static publishing behavior is tested against the built output.
- Full hardware/model testing remains manual because devices and model caches vary.

## Alternatives Considered

- GitHub Actions was rejected by project constraints.
- Testing real USB devices in automation was rejected as impractical for local hooks.
