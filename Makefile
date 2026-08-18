.PHONY: dev dev-backend dev-frontend install install-backend install-frontend \
        migrate generate-types test test-backend lint-backend

BACKEND_DIR  := backend
FRONTEND_DIR := frontend
PYTHON       := .venv/bin/python
UVICORN      := .venv/bin/uvicorn
ALEMBIC      := .venv/bin/alembic

# ---------------------------------------------------------------------------
# Dev servers
# ---------------------------------------------------------------------------

dev: ## Start both backend and frontend concurrently
	@$(MAKE) -j2 dev-backend dev-frontend

dev-backend: ## Start FastAPI dev server on :8000
	cd $(BACKEND_DIR) && $(UVICORN) main:app --reload --port 8000

dev-frontend: ## Start Next.js dev server on :3000
	cd $(FRONTEND_DIR) && npm run dev

# ---------------------------------------------------------------------------
# Install
# ---------------------------------------------------------------------------

install: install-backend install-frontend ## Install all dependencies

install-backend: ## Create venv and install Python deps
	python3 -m venv $(BACKEND_DIR)/.venv
	$(BACKEND_DIR)/.venv/bin/pip install -r $(BACKEND_DIR)/requirements.txt

install-frontend: ## Install Node deps
	cd $(FRONTEND_DIR) && npm install

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

migrate: ## Run Alembic migrations
	cd $(BACKEND_DIR) && $(ALEMBIC) upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create MSG="your message")
	cd $(BACKEND_DIR) && $(ALEMBIC) revision --autogenerate -m "$(MSG)"

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

generate-types: ## Generate frontend types from FastAPI OpenAPI schema
	curl -s http://localhost:8000/openapi.json > $(FRONTEND_DIR)/openapi.json
	cd $(FRONTEND_DIR) && npx openapi-typescript openapi.json -o src/types/api.ts
	rm $(FRONTEND_DIR)/openapi.json

# ---------------------------------------------------------------------------
# Testing & Linting
# ---------------------------------------------------------------------------

test: test-backend ## Run all tests

test-backend: ## Run backend tests
	cd $(BACKEND_DIR) && $(PYTHON) -m pytest tests/ -v

lint-backend: ## Lint and format backend with ruff
	cd $(BACKEND_DIR) && .venv/bin/ruff check . && .venv/bin/ruff format .

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
