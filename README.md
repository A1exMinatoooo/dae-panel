# dae Panel

[![Build and Release](https://github.com/A1exMinatoooo/dae-panel/actions/workflows/release.yml/badge.svg)](https://github.com/A1exMinatoooo/dae-panel/actions/workflows/release.yml)
[![CI](https://github.com/A1exMinatoooo/dae-panel/actions/workflows/ci.yml/badge.svg)](https://github.com/A1exMinatoooo/dae-panel/actions/workflows/ci.yml)

A web-based management panel for [dae](https://github.com/daeuniverse/dae) - the high-performance transparent proxy solution.

## Features

- **Dashboard**: View dae status (Running/Suspended/Stopped), PID, uptime, panel version, dae version, platform info, and quick-action buttons (Reload, Suspend, Resume)
- **Config Editor**: Read/edit/validate dae configuration with two modes:
  - Monaco-based raw text editor for direct file editing
  - Form-based section editor that parses dae config blocks (global, dns, group, routing, subscription, node)
  - Config saves create timestamped backups and can optionally trigger hot-reload
- **Real-time Logs**: Stream dae logs via Server-Sent Events (SSE) with:
  - Level filtering (error/warn/info/debug/trace/unknown)
  - Keyword search with highlighting
  - Auto-scroll and history retrieval
- **Theme Support**: Light, dark, and system-following themes with CSS custom properties
- **Systemd Service**: Install/uninstall itself as a systemd service via `dae-panel install` / `dae-panel uninstall`
- **Single Binary Deployment**: React frontend is embedded into the Go binary via `go:embed`, so the entire application is a single self-contained file

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Go Binary (dae-panel)                          │
│                                                 │
│  main.go                                        │
│    ├── CLI: install/uninstall/serve              │
│    ├── Flag parsing + env var overrides          │
│    └── api.Start(cfg, staticFS)                 │
│                                                 │
│  internal/api/                                  │
│    ├── router.go ─── Gin Engine                 │
│    │   ├── CORS middleware                       │
│    │   ├── Basic Auth middleware                 │
│    │   ├── Static file serving (embedded SPA)    │
│    │   └── SPA fallback (index.html)            │
│    ├── handler_info.go   → dae.GetStatus()      │
│    │                      → dae.GetVersion()     │
│    │                      → dae.GetProcessUptime()│
│    ├── handler_config.go → dae.ReadConfig()     │
│    │                      → dae.WriteConfig()    │
│    │                      → dae.BackupConfig()   │
│    │                      → dae.ValidateContent()│
│    │                      → dae.Reload()         │
│    ├── handler_daemon.go → dae.Reload()         │
│    │                      → dae.Suspend()        │
│    └── handler_logs.go   → LogBroadcaster       │
│                             → dae.GetRecentLogs()│
│                                                 │
│  internal/dae/                                  │
│    ├── daemon.go ─── Process management         │
│    │   ├── PID from /var/run/dae.pid            │
│    │   ├── Uptime from /proc/<pid>/stat         │
│    │   └── CLI: dae reload/suspend/--version    │
│    ├── config.go ─── File I/O                   │
│    │   ├── Read/Write config file               │
│    │   ├── Timestamped backup                   │
│    │   └── Validate via dae CLI (temp file)     │
│    └── logstream.go ─── Log streaming           │
│        ├── LogBroadcaster (pub/sub via channels) │
│        ├── journalctl -u dae -f --output=json   │
│        └── dae level normalization              │
│                                                 │
│  internal/service/installer.go                  │
│    └── systemd install/uninstall                │
│                                                 │
│  web/dist/ (embedded)                           │
│    └── React SPA (built separately)             │
└─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────┐
│  dae daemon     │ (separate process)
│  /var/run/dae.pid│
│  journalctl -u dae│
└─────────────────┘
```

## Quick Start

### Download

Download the latest `dae-panel` binary from [Releases](https://github.com/A1exMinatoooo/dae-panel/releases).

### Run

```bash
# Basic usage
sudo ./dae-panel --config /etc/dae/config.dae --port 8080

# Print the version embedded at build time
./dae-panel --version

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
| `--version` | — | — | Print the build version and exit |

## Build from Source

### Prerequisites

- Go 1.22+
- Node.js 18+
- npm

### Build

```bash
# Clone
git clone https://github.com/A1exMinatoooo/dae-panel.git
cd dae-panel

# Build with an explicit release version
make build VERSION=v1.0.4

# Cross-compile for Linux x86_64 with the same version
make build-linux VERSION=v1.0.4
```

Or use make:

```bash
make build          # Version from git describe, or dev outside a Git checkout
make build-linux    # Cross-compile for Linux x86_64
make install        # Build and install as systemd service
```

`VERSION` is the product version source for both the embedded frontend and the Go binary. Build wrappers use `git describe --tags --always --dirty` when `VERSION` is unset and fall back to `dev` when Git metadata is unavailable. A direct `go build` without linker flags also reports `dev`.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/info` | No | Panel version, dae version, platform, uptime, config path |
| `GET` | `/api/status` | No | dae running status (Running/Suspended/Stopped) |
| `GET` | `/api/config` | Yes | Get config file content |
| `PUT` | `/api/config` | Yes | Save config file (validates → backs up → writes → optionally reloads) |
| `POST` | `/api/config/validate` | Yes | Validate config syntax |
| `POST` | `/api/reload` | Yes | Hot reload dae |
| `POST` | `/api/suspend` | Yes | Suspend dae |
| `POST` | `/api/resume` | Yes | Resume dae |
| `GET` | `/api/logs/stream` | Yes | SSE real-time log stream |
| `GET` | `/api/logs/history` | Yes | Get recent log entries |

Log entries preserve journald's raw `MESSAGE`, provide a cleaned `message` for display, and normalize `level` to `error`, `warn`, `info`, `debug`, `trace`, or `unknown`. `FATAL` and `PANIC` are classified as `error`; legacy `warning` values are classified as `warn`.

## Development

### Local Development (two-terminal setup)

```bash
# Terminal 1: Backend
go run . --config /path/to/config.dae --port 8080

# Terminal 2: Frontend (hot-reload dev server)
cd web && npm run dev
# Access at http://localhost:5173 (proxies /api to :8080)
```

### Production Build

```bash
make build          # Full build for current platform
make build-linux    # Cross-compile for Linux x86_64
```

## Tech Stack

**Backend (Go):**
- Go 1.22
- Gin v1.10.0 (HTTP framework)
- go:embed (frontend embedding)
- Standard library (os/exec, os/signal, encoding/json, sync)

**Frontend (React/TypeScript):**
- React 18.3
- TypeScript 5.4
- Vite 5.3 (build tool)
- React Router DOM 6.23 (client-side routing)
- Axios 1.7 (HTTP client)
- Monaco Editor 4.6 (code editor)
- Tailwind CSS 3.4 (styling)
- Lucide React 0.378 (icons)

**Infrastructure:**
- systemd (service management)
- journalctl (log source)
- procfs (/proc) (process monitoring)
- GitHub Actions (CI/CD)

## Credits

This project is powered by [OpenCode](https://github.com/anomalyco/opencode) and [XiaoMi MiMo-V2.5-Pro](https://github.com/XiaoMi/MiMo).

## License

AGPL-3.0
