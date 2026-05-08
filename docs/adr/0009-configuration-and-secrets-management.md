# 0009 Configuration and Secrets Management

## Status

Accepted

## Context

Mode A must not put secrets in the frontend. The app needs only public build metadata such as version, repository URL, PayPal URL, and fallback commit value.

## Decision

Use Vite environment variables for non-secret build metadata only. Commit `.env.example` with placeholders. Use `gitleaks` in local hooks to block secrets before commit.

## Consequences

- There are no runtime secrets to rotate.
- The frontend can safely expose repository and support links.
- Any feature requiring a private key or credential is out of scope until the deployment mode is revisited.

## Alternatives Considered

- Encrypted or obfuscated frontend secrets were rejected because they are still client-visible secrets.
