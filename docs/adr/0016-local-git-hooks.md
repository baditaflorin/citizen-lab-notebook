# 0016 Local Git Hooks

## Status

Accepted

## Context

The project forbids GitHub Actions for checks. Quality gates must run locally and be easy to install.

## Decision

Use plain `.githooks/` scripts wired by:

```sh
make install-hooks
```

Hooks:

- `pre-commit`: format check, lint, typecheck, and `gitleaks protect --staged`.
- `commit-msg`: Conventional Commits validation.
- `pre-push`: `make test`, `make build`, and `make smoke`.
- `post-merge` and `post-checkout`: install dependencies when `package-lock.json` changes.

## Consequences

- Contributors can run the same checks manually through Makefile targets.
- Hooks are transparent shell scripts rather than hidden CI.
- The first install requires local Node, npm, and gitleaks.

## Alternatives Considered

- Lefthook was considered but plain hooks are sufficient and easier to audit.
