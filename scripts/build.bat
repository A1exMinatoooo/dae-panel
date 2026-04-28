@echo off
echo Building frontend...
cd web
call npm install
call npm run build
cd ..

echo Building backend...
set GOOS=windows
set GOARCH=amd64
set CGO_ENABLED=0
go build -o dae-panel.exe .

echo Build complete: dae-panel.exe
