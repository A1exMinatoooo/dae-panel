# AGENT.md

Build and development instructions for AI agents working on dae-panel.

## Project Structure

```
dae-panel/
├── main.go                    # Entry point, CLI args, embed
├── go.mod / go.sum            # Go dependencies
├── Makefile                   # Build commands
├── install/                   # systemd service files
│   ├── dae-panel.service
│   └── dae-panel.env
├── internal/
│   ├── api/                   # HTTP handlers (Gin)
│   │   ├── router.go          # Routes + static file serving
│   │   ├── handler_config.go  # Config CRUD
│   │   ├── handler_daemon.go  # reload/suspend/resume
│   │   ├── handler_info.go    # Status + version
│   │   └── handler_logs.go    # SSE log streaming
│   ├── dae/                   # dae interaction
│   │   ├── config.go          # Config file read/write
│   │   ├── daemon.go          # Process management, /proc parsing
│   │   └── logstream.go       # journalctl SSE broadcaster
│   ├── service/
│   │   └── installer.go       # systemd install/uninstall
│   └── config/
│       └── panel.go           # PanelConfig struct
├── web/                       # React frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx            # Routes
│   │   ├── api/client.ts      # Axios API client
│   │   ├── components/        # UI components
│   │   ├── pages/             # Page components
│   │   └── hooks/             # Custom hooks (useTheme)
│   └── dist/                  # Build output (gitignored)
└── scripts/
    ├── build.sh               # Linux build script
    └── build.bat              # Windows build script
```

## Build Commands

### Frontend

```bash
cd web
npm install          # Install dependencies
npm run build        # Production build → web/dist/
npm run dev          # Dev server (port 5173, proxies /api to :8080)
```

### Backend

```bash
# Current platform
go build -o dae-panel .

# Linux x86_64 (cross-compile)
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o dae-panel .

# Windows
go build -o dae-panel.exe .
```

### Full Build (frontend + backend)

```bash
make build           # Current platform
make build-linux     # Linux x86_64
```

## Key Technical Details

### Frontend Embedding

The frontend is embedded into the Go binary via `//go:embed web/dist/*` in `main.go`. The `web/dist/` directory must exist before building Go. If missing, create a placeholder:

```bash
mkdir -p web/dist && echo '<html><body>Build frontend first</body></html>' > web/dist/index.html
```

### Static File Serving

The router in `internal/api/router.go` serves embedded files using `fs.ReadFile`. SPA routing is handled by falling back to `index.html` for non-API, non-file routes.

### dae Interaction

- **Config**: Direct file read/write to the path specified by `--config`
- **Reload/Suspend**: Uses `dae reload` and `dae suspend` CLI commands
- **Status**: Reads PID from `/var/run/dae.pid`, checks process existence
- **Version**: `dae --version`
- **Uptime**: Reads `/proc/<pid>/stat` field 22 (start ticks), calculates against `/proc/uptime`
- **Logs**: `journalctl -u dae -f --output=json`, parses `level=` from MESSAGE field

### Log Level Parsing

dae logs contain `level=info|warning|error|debug` in the message text. The `extractLevel()` function in `logstream.go` uses regex `\blevel=(\w+)\b` to extract it.

### Authentication

- API endpoints use HTTP Basic Auth
- SSE endpoint (`/api/logs/stream`) accepts auth via query parameter `?auth=<base64>` because EventSource doesn't support custom headers
- Credentials are stored in localStorage on the frontend

### Theme System

- `ThemeProvider` context in `web/src/hooks/useTheme.tsx`
- CSS custom properties defined in `web/src/index.css`
- Theme preference saved to `localStorage` as `dae_panel_theme`
- Monaco Editor switches between `vs-dark` and `vs-light`

## Common Issues

### "pattern web/dist/*: no matching files found"

Frontend not built. Run `cd web && npm install && npm run build` first, or create placeholder:

```bash
mkdir -p web/dist && echo '<html></html>' > web/dist/index.html
```

### Config not saving from CLI flags

When using `dae-panel serve --config ...`, the `serve` argument is removed from `os.Args` before `flag.Parse()` runs.

### Logs show wrong timestamp

`__REALTIME_TIMESTAMP` from journalctl is in microseconds. Divide by 1000000 for seconds, or 1000 for milliseconds. The frontend `formatTime()` handles both cases.

### Log level shows empty or wrong

The `level` field in JSON is lowercase. The Go struct field is `Level` with json tag `level`. Frontend must use lowercase `level` to match.

## Testing Locally

```bash
# Terminal 1: Run backend
go run . --config /path/to/config.dae --port 8080

# Terminal 2: Run frontend dev server
cd web && npm run dev
# Access at http://localhost:5173 (proxies API to :8080)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DAE_PANEL_PORT` | `8080` | HTTP port |
| `DAE_PANEL_CONFIG` | `/etc/dae/config.dae` | dae config path |
| `DAE_PANEL_USERNAME` | `admin` | Auth username |
| `DAE_PANEL_PASSWORD` | `dae-panel` | Auth password |
