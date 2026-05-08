# Citizen Lab Notebook

Live site: https://baditaflorin.github.io/citizen-lab-notebook/

Repository: https://github.com/baditaflorin/citizen-lab-notebook

Citizen Lab Notebook is a browser-based science fair notebook for capturing observations, sensor data, figures, metadata, and report drafts without a hosted backend.

## Quickstart

```sh
npm install
make dev
make test
make build
make pages-preview
```

## Status

This repository is implemented as a Mode A GitHub Pages application. The frontend is the product: browser storage, local computation, lazy WASM/model loading, and static publishing from `docs/`.

## Architecture

See `docs/architecture.md` and the ADRs in `docs/adr/`.

## Deploy

GitHub Pages serves `docs/` from the `main` branch:

https://baditaflorin.github.io/citizen-lab-notebook/

Manual deploy and rollback notes live in `docs/deploy.md`.
