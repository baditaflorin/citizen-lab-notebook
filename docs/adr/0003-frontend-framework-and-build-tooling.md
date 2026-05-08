# 0003 Frontend Framework and Build Tooling

## Status

Accepted

## Context

The app needs a rich browser UI, strict TypeScript, a fast local dev loop, and a production build that can publish directly to GitHub Pages.

## Decision

Use React, TypeScript strict mode, and Vite. Use Tailwind CSS for utility styling and a small amount of app-specific CSS for print and SVG layout. Use Vitest for unit tests and Playwright for the smoke/e2e path.

## Consequences

- Vite can build directly into `docs/` with hashed assets and a configured Pages base path.
- React keeps stateful notebook interactions understandable.
- The initial bundle must stay lean; heavy analysis/model libraries are loaded in workers only after user action.

## Alternatives Considered

- Svelte was viable, but React has broader ecosystem support for testing and future contributors.
- Plain TypeScript was rejected because the UI has enough state to benefit from a component model.
