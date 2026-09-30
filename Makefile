.PHONY: build build-frontend build-backend build-linux install uninstall clean dev dev-backend

VERSION := $(if $(strip $(VERSION)),$(VERSION),$(shell git describe --tags --always --dirty 2>/dev/null || echo dev))
VERSION_PACKAGE := github.com/daeuniverse/dae-panel/internal/version.Version
GO_VERSION_LDFLAGS := -X $(VERSION_PACKAGE)=$(VERSION)

# Default target
build: build-frontend build-backend

# Build frontend only
build-frontend:
	cd web && npm install && VITE_APP_VERSION=$(VERSION) npm run build

# Build backend only (requires frontend to be built first for embed)
build-backend:
	go build -ldflags="$(GO_VERSION_LDFLAGS)" -o dae-panel .

# Build for Linux (cross-compile from Windows/macOS)
build-linux:
	cd web && npm install && VITE_APP_VERSION=$(VERSION) npm run build
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="$(GO_VERSION_LDFLAGS)" -o dae-panel .

# Install as systemd service (Linux only)
install: build-linux
	sudo ./dae-panel install

# Uninstall systemd service
uninstall:
	sudo ./dae-panel uninstall

# Clean build artifacts
clean:
	rm -rf dae-panel dae-panel.exe web/dist web/node_modules

# Run in development mode
dev:
	cd web && npm run dev

# Run backend in development mode
dev-backend:
	go run . --port 8080
