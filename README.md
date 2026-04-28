# dae Panel

A web-based management panel for [dae](https://github.com/daeuniverse/dae) - the high-performance transparent proxy solution.

## Features

- **Dashboard**: View dae status, version, uptime, and quick actions (reload/suspend/resume)
- **Config Editor**: Edit dae configuration with Monaco Editor (raw text) or form-based section editor
- **Real-time Logs**: Stream dae logs via SSE with level filtering and keyword highlighting
- **Theme Support**: Light/dark/system theme toggle
- **Systemd Service**: Install as a system daemon with one command
- **Single Binary**: Frontend embedded via `go:embed`, deploy with a single file

## Quick Start

### Download

Download the latest `dae-panel` binary from releases.

### Run

```bash
# Basic usage
sudo ./dae-panel --config /etc/dae/config.dae --port 8080

# With custom auth
sudo ./dae-panel --config /etc/dae/config.dae --port 8080 --username admin --password mypassword

# With 'serve' subcommand
sudo ./dae-panel serve --config /etc/dae/config.dae --port 8080
```

Open `http://<your-ip>:8080` in your browser.

Default credentials: `admin` / `dae-panel`

### Install as System Service

```bash
sudo ./dae-panel install
sudo systemctl start dae-panel
sudo systemctl enable dae-panel
```

Manage the service:
```bash
sudo systemctl status dae-panel
sudo systemctl restart dae-panel
sudo journalctl -u dae-panel -f
```

### Uninstall

```bash
sudo ./dae-panel uninstall
```

## Configuration

| Flag | Env Variable | Default | Description |
|------|-------------|---------|-------------|
| `--config` | `DAE_PANEL_CONFIG` | `/etc/dae/config.dae` | Path to dae config file |
| `--port` | `DAE_PANEL_PORT` | `8080` | HTTP server port |
| `--username` | `DAE_PANEL_USERNAME` | `admin` | Basic auth username |
| `--password` | `DAE_PANEL_PASSWORD` | `dae-panel` | Basic auth password |

## Build from Source

### Prerequisites

- Go 1.22+
- Node.js 18+
- npm

### Build

```bash
# Clone
git clone https://github.com/your-org/dae-panel.git
cd dae-panel

# Build frontend
cd web && npm install && npm run build && cd ..

# Build backend (with embedded frontend)
go build -o dae-panel .

# Cross-compile for Linux x86_64
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o dae-panel .
```

Or use make:

```bash
make build          # Build for current platform
make build-linux    # Cross-compile for Linux x86_64
make install        # Build and install as systemd service
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/info` | No | Version, platform, uptime |
| `GET` | `/api/status` | No | dae running status |
| `GET` | `/api/config` | Yes | Get config file content |
| `PUT` | `/api/config` | Yes | Save config file |
| `POST` | `/api/config/validate` | Yes | Validate config syntax |
| `POST` | `/api/reload` | Yes | Hot reload dae |
| `POST` | `/api/suspend` | Yes | Suspend dae |
| `POST` | `/api/resume` | Yes | Resume dae |
| `GET` | `/api/logs/stream` | Yes | SSE real-time log stream |
| `GET` | `/api/logs/history` | Yes | Get recent log entries |

## License

AGPL-3.0
