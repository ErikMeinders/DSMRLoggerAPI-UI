# DSMR Logger UI Makefile
# ======================

# Default configuration
DEFAULT_HOST ?= dsmr-mw9.local
DEFAULT_FILE ?= dashboard.html

# Override defaults with environment variables or command line
HOST ?= $(DEFAULT_HOST)
FILE ?= $(DEFAULT_FILE)

.PHONY: help deploy install clean check-deps fm-upload

# Default target
help: ## Show this help message
	@echo "DSMR Logger UI - Available targets:"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "Configuration variables:"
	@echo "  HOST=$(HOST)"
	@echo "  FILE=$(FILE)"
	@echo ""
	@echo "fm-upload examples:"
	@echo "  make deploy                                      # Uses defaults"
	@echo "  make deploy HOST=192.168.1.100                  # Custom host"
	@echo "  make deploy FILE=my-dashboard.html               # Custom file"
	@echo "  make deploy HOST=192.168.1.100 FILE=index.html  # Both custom"
	@echo "  make fm-upload FILE=style.css HOST=dsmr-mw9.local"
	@echo ""

# Check if node_modules exists and dependencies are installed
check-deps:
	@if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then \
		echo "Dependencies not found. Installing..."; \
		$(MAKE) install; \
	fi

install: ## Install Node.js dependencies
	@echo "Installing Node.js dependencies..."
	npm install
	@echo "Dependencies installed successfully."

deploy: check-deps ## Deploy file to host (usage: make deploy [HOST=host] [FILE=file])
	@echo "Deploying $(FILE) to $(HOST)..."
	node fm-upload.js $(FILE) $(HOST):
	@echo "Deployment completed."


clean: ## Clean node_modules and package-lock.json
	@echo "Cleaning dependencies..."
	rm -rf node_modules package-lock.json
	@echo "Clean completed."

# Check if required files exist
check-files: ## Verify required files exist
	@echo "Checking required files..."
	@if [ ! -f "fm-upload.js" ]; then \
		echo "❌ fm-upload.js not found"; \
		exit 1; \
	fi
	@if [ ! -f "dashboard.html" ]; then \
		echo "⚠️  dashboard.html not found (create this file first)"; \
	else \
		echo "✅ dashboard.html found"; \
	fi
	@if [ ! -f "package.json" ]; then \
		echo "❌ package.json not found"; \
		exit 1; \
	fi
	@echo "✅ Required files check completed."

# Validate upload script syntax
validate: ## Validate upload script syntax
	@echo "Validating upload script..."
	node -c fm-upload.js
	@echo "✅ Upload script syntax is valid."

# Show project status
status: check-files ## Show project status and configuration
	@echo ""
	@echo "DSMR Logger UI - Project Status"
	@echo "==============================="
	@echo ""
	@if [ -f "package.json" ]; then \
		echo "📦 Package: $$(node -e "console.log(require('./package.json').name + ' v' + require('./package.json').version)")"; \
	fi
	@if [ -d "node_modules" ]; then \
		echo "📁 Dependencies: Installed"; \
	else \
		echo "📁 Dependencies: Not installed (run 'make install')"; \
	fi
	@if [ -f "$(FILE)" ]; then \
		FILESIZE=$$(stat -f%z $(FILE) 2>/dev/null || stat -c%s $(FILE) 2>/dev/null || echo "unknown"); \
		echo "📄 File: $(FILE) ($${FILESIZE} bytes)"; \
	else \
		echo "📄 File: $(FILE) (not found)"; \
	fi
	@echo ""

# Generic file upload using fm-upload tool
fm-upload: check-deps ## Upload any file (usage: make fm-upload FILE=file.html HOST=host.local)
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter required. Usage: make fm-upload FILE=file.html HOST=host.local"; \
		exit 1; \
	fi
	@if [ -z "$(HOST)" ]; then \
		echo "Error: HOST parameter required. Usage: make fm-upload FILE=file.html HOST=host.local"; \
		exit 1; \
	fi
	@echo "Uploading $(FILE) to $(HOST)..."
	node fm-upload.js $(FILE) $(HOST):
	@echo "Upload completed."

# Development helpers
dev-install: ## Install development dependencies and setup
	$(MAKE) install
	@echo "Development environment ready."

# Default deploy target for convenience
.DEFAULT_GOAL := help
