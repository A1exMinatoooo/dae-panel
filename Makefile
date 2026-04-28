.PHONY: build build-frontend build-backend install uninstall clean dev

# Default target
build: build-frontend build-backend

# Build frontend only
build-frontend:
	cd web && npm install && npm run build

# Build backend only (requires frontend to be built first for embed)
build-backend:
	go build -o dae-panel .

# Build for Linux (cross-compile from Windows/macOS)
build-linux:
	cd web && npm install && npm run build
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o dae-panel .

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
