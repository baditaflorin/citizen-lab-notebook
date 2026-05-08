.PHONY: help install-hooks dev build test test-integration smoke lint fmt pages-preview demo-screenshot clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@printf "%s\n" "Citizen Lab Notebook targets"
	@printf "%s\n" "  make install-hooks     wire .githooks"
	@printf "%s\n" "  make dev               run the Vite dev server"
	@printf "%s\n" "  make build             build GitHub Pages output into docs/"
	@printf "%s\n" "  make test              run unit tests with coverage"
	@printf "%s\n" "  make test-integration  run Playwright e2e tests"
	@printf "%s\n" "  make smoke             build, serve docs/, and run a browser smoke test"
	@printf "%s\n" "  make lint              run ESLint, Prettier check, TypeScript, and npm audit"
	@printf "%s\n" "  make fmt               format files"
	@printf "%s\n" "  make pages-preview     serve docs/ under the GitHub Pages base path"
	@printf "%s\n" "  make demo-screenshot   capture docs/demo.png for the README"
	@printf "%s\n" "  make clean             remove generated local artifacts"

install-hooks:
	git config core.hooksPath .githooks

dev:
	npm run dev

build:
	npm run build
	test -f docs/index.html
	test -f docs/404.html

test:
	npm run test

test-integration:
	npm run test:e2e

smoke:
	npm run smoke

lint:
	npm run fmt:check
	npm run lint
	npm run typecheck
	npm run audit:security

fmt:
	npm run fmt

pages-preview:
	bash scripts/pages-preview.sh

demo-screenshot:
	bash scripts/capture-demo.sh

hooks-pre-commit:
	.githooks/pre-commit

hooks-commit-msg:
	@test -n "$(MSG)" || (echo "Set MSG=/path/to/commit-message" && exit 1)
	.githooks/commit-msg "$(MSG)"

hooks-pre-push:
	.githooks/pre-push

clean:
	rm -rf coverage playwright-report test-results .vite
