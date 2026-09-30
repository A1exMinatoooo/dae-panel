@echo off
if not defined VERSION (
    for /f "delims=" %%V in ('git describe --tags --always --dirty 2^>nul') do set "VERSION=%%V"
)
if not defined VERSION set "VERSION=dev"
set "VITE_APP_VERSION=%VERSION%"

echo Building frontend...
cd web
call npm install
call npm run build
cd ..

echo Building backend...
set GOOS=windows
set GOARCH=amd64
set CGO_ENABLED=0
go build -ldflags "-X github.com/daeuniverse/dae-panel/internal/version.Version=%VERSION%" -o dae-panel.exe .

echo Build complete: dae-panel.exe
