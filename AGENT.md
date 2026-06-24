# AGENT.md

Build and development instructions for AI agents working on dae-panel.

## Project Overview

dae-panel is a web-based management panel for [dae](https://github.com/daeuniverse/dae), a high-performance transparent proxy solution. It provides a browser-based UI for managing and monitoring a running dae instance on Linux systems.

**Core Features:**
- Dashboard with dae status, version, uptime, and quick actions
- Config editor with Monaco raw text editor and form-based section editor
- Real-time log streaming via SSE with level filtering and search
- Theme support (light/dark/system)
- Systemd service installation
- Single binary deployment with embedded React frontend

## Project Structure

```
dae-panel/
├── main.go                          # Entry point: CLI subcommands, flag parsing, go:embed
├── go.mod / go.sum                  # Go module (github.com/daeuniverse/dae-panel)
├── Makefile                         # Build targets
├── LICENSE                          # AGPL-3.0
├── README.md                        # User documentation
├── AGENT.md                         # This file
├── .gitignore
├── .github/workflows/
│   ├── ci.yml                       # CI: builds on push/PR to main
│   └── release.yml                  # Release: multi-arch builds on tag push
├── install/
│   ├── dae-panel.service            # Systemd unit file (template)
│   └── dae-panel.env                # Default environment variables
├── scripts/
│   ├── build.sh                     # Linux/macOS build script
│   └── build.bat                    # Windows build script
├── internal/
│   ├── config/
│   │   └── panel.go                 # PanelConfig struct (Port, ConfigPath, Username, Password)
│   ├── version/
│   │   └── version.go               # Version string (currently "v1.0.3")
│   ├── dae/
│   │   ├── daemon.go                # Process management: PID, status, uptime, reload/suspend
│   │   ├── config.go                # Config file CRUD: read/write/backup/validate
│   │   └── logstream.go             # LogBroadcaster: journalctl SSE streaming
│   ├── service/
│   │   └── installer.go             # systemd install/uninstall logic
│   └── api/
│       ├── router.go                # Gin router: CORS, Basic Auth, static serving, SPA fallback
│       ├── handler_info.go          # GET /api/info, GET /api/status
│       ├── handler_config.go        # GET/PUT /api/config, POST /api/config/validate
│       ├── handler_daemon.go        # POST /api/reload, /api/suspend, /api/resume
│       └── handler_logs.go          # GET /api/logs/stream (SSE), /api/logs/history
└── web/
    ├── embed.go                     # Alternative go:embed declaration
    ├── package.json                 # React 18.3, TypeScript 5.4, Vite 5.3, Tailwind 3.4
    ├── vite.config.ts               # Vite config: React plugin, @ alias, dev proxy
    ├── tsconfig.json / tsconfig.node.json
    ├── tailwind.config.js           # Tailwind: class-based dark mode, custom primary palette
    ├── postcss.config.js
    ├── index.html                   # SPA entry point
    └── src/
        ├── main.tsx                 # ReactDOM root: BrowserRouter > ThemeProvider > App
        ├── index.css                # CSS custom properties for light/dark themes
        ├── App.tsx                  # Routes: /dashboard, /config, /logs, /settings
        ├── api/
        │   └── client.ts            # Axios instance with Basic Auth, typed API functions, LogStream class
        ├── hooks/
        │   └── useTheme.tsx          # ThemeProvider context: theme state, localStorage persistence
        ├── components/
        │   ├── Layout.tsx            # Flex layout: Sidebar + main content with <Outlet>
        │   ├── Sidebar.tsx           # Navigation sidebar with icon links
        │   ├── ThemeToggle.tsx       # Three-button toggle (Sun/Moon/Monitor)
        │   ├── StatusBadge.tsx       # Colored badge (Running=green, Suspended=yellow, Stopped=red)
        │   └── LogViewer.tsx         # Log display with history, SSE, auto-scroll, search highlighting
        └── pages/
            ├── Dashboard.tsx         # Status/info cards, quick actions, 5-second polling
            ├── ConfigEditor.tsx      # Monaco editor or form section editor, validate/save/save+reload
            ├── Logs.tsx              # Log page with level filter and search input
            └── Settings.tsx          # Credential settings (localStorage), systemd instructions
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
make install         # Build and install as systemd service
make clean           # Remove binary, web/dist, web/node_modules
```

## Key Technical Details

### Frontend Embedding

The frontend is embedded into the Go binary via `//go:embed web/dist/*` in `main.go`. The `web/dist/` directory must exist before building Go. If missing, create a placeholder:

```bash
mkdir -p web/dist && echo '<html><body>Build frontend first</body></html>' > web/dist/index.html
```

### Static File Serving

The router in `internal/api/router.go` serves embedded files using `fs.ReadFile`. SPA routing is handled by falling back to `index.html` for non-API, non-file routes via the `NoRoute` handler.

### dae Interaction

- **Config**: Direct file read/write to the path specified by `--config`
- **Reload/Suspend**: Uses `dae reload` and `dae suspend` CLI commands via `os/exec`
- **Status**: Reads PID from `/var/run/dae.pid`, checks process existence with `signal(0)`
- **Version**: `dae --version`
- **Uptime**: Reads start ticks from `/proc/<pid>/stat` field 22, divides by 100 (clock ticks/sec), subtracts from `/proc/uptime`
- **Logs**: `journalctl -u dae -f --output=json`, parses JSON entries, extracts level via regex `\blevel=(\w+)\b`

### Log Level Parsing

dae logs contain `level=info|warning|error|debug` in the message text. The `extractLevel()` function in `logstream.go` uses regex to extract it. The `LogBroadcaster` runs a persistent journalctl process and fans out log entries to all connected SSE clients via channels.

### Authentication

- API endpoints use HTTP Basic Auth
- SSE endpoint (`/api/logs/stream`) accepts auth via query parameter `?auth=<base64(user:pass)>` because EventSource doesn't support custom headers
- Credentials are stored in localStorage on the frontend
- Frontend Axios instance has interceptor that adds Basic Auth header to all requests

### Theme System

- `ThemeProvider` context in `web/src/hooks/useTheme.tsx`
- CSS custom properties defined in `web/src/index.css`
- Theme preference saved to `localStorage` as `dae_panel_theme`
- System theme detection via `window.matchMedia('(prefers-color-scheme: dark)')`
- Monaco Editor switches between `vs-dark` and `vs-light` themes

### Config Editor

Two editing modes:
1. **Raw text mode**: Monaco Editor for direct file editing
2. **Form section mode**: Parses dae config into structured blocks (global, dns, group, routing, subscription, node) with form fields

Config saves:
- Validate content via `dae validate -c <tempfile>`
- Create timestamped backup (`<path>.bak.YYYYMMDDHHMMSS`)
- Write new content
- Optionally trigger hot-reload

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

## Development Workflow

1. **Make changes**: Edit Go backend or React frontend
2. **Test locally**: Run backend and frontend dev servers in separate terminals
3. **Build**: Use `make build` for full build or build frontend/backend separately
4. **Lint/Typecheck**: 
   - Frontend: `cd web && npm run lint` (if configured)
   - Backend: `go vet ./...`
5. **Commit**: Follow commit conventions below

## Commit Conventions

**CRITICAL: Every improvement must be committed with appropriate granularity.**

### Commit Rules

1. **Atomic commits**: Each commit should represent a single logical change
2. **Commit after each improvement**: Do not batch multiple unrelated changes
3. **Verify before commit**: Run lint/typecheck commands before committing
4. **Never commit secrets**: Do not include .env, credentials, or API keys

### Commit Granularity

| Change Type | Commit Scope | Example |
|-------------|--------------|---------|
| Bug fix | Single commit | `fix: resolve config validation error` |
| New feature | Single commit per feature | `feat: add dark mode toggle` |
| Refactor | Single commit per refactor | `refactor: extract API client logic` |
| Documentation | Single commit | `docs: update README installation steps` |
| Style/UI | Single commit | `style: improve dashboard layout` |
| Test | Single commit | `test: add config validation tests` |
| Build/CI | Single commit | `build: update Go version to 1.22` |

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code refactoring without functionality changes
- `test`: Adding or updating tests
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Maintenance tasks

**Examples:**
```bash
# Good - atomic commits
git commit -m "feat(config): add form-based section editor"
git commit -m "fix(logs): resolve SSE connection timeout"
git commit -m "docs(readme): update API endpoint table"

# Bad - too broad
git commit -m "update everything"
git commit -m "fix bugs and add features"
```

### Pre-commit Checklist

Before committing, verify:
- [ ] Code compiles/builds successfully
- [ ] Lint/typecheck passes (if configured)
- [ ] No secrets or credentials in changes
- [ ] Commit message follows format
- [ ] Change is atomic (single logical unit)

### Commit Workflow

```bash
# 1. Make changes
# 2. Verify changes work
go vet ./...                    # Backend
cd web && npm run build         # Frontend

# 3. Stage specific files
git add <changed-files>

# 4. Commit with proper message
git commit -m "feat(scope): description"

# 5. Verify commit
git log --oneline -1
```

## Architecture Patterns

- **Backend**: Clean separation between API handlers (internal/api), business logic (internal/dae), and service management (internal/service)
- **Frontend**: Component-based architecture with pages, components, hooks, and API client
- **Communication**: REST API for CRUD operations, SSE for real-time log streaming
- **State Management**: React context for theme, localStorage for credentials
- **Styling**: Tailwind CSS with class-based dark mode, CSS custom properties for theme colors