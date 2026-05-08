# Contributing

Thanks for improving Citizen Lab Notebook.

## Local Setup

```sh
npm install
make install-hooks
make test
make build
make smoke
```

## Commit Style

Use Conventional Commits:

```text
feat: add sensor import preview
fix: handle empty data series
docs: document Pages deploy
```

## Safety

Do not commit secrets, real `.env` files, private keys, API keys, tokens, or credentials. The pre-commit hook runs `gitleaks protect --staged`.
