# Deploy

Live URL:

https://baditaflorin.github.io/citizen-lab-notebook/

## Publishing Strategy

GitHub Pages serves the `docs/` directory from the `main` branch. The production Vite build writes directly into `docs/`, and `docs/` is intentionally committed.

## Manual Republish

```sh
npm install
make build
git add docs
git commit -m "chore: publish Pages build"
git push origin main
```

## Rollback

Revert the publishing commit and push `main`:

```sh
git revert <commit_sha>
git push origin main
```

## Custom Domain

If a custom domain is added later, add `docs/CNAME` with the domain name and configure DNS with GitHub Pages according to GitHub's current documentation.
