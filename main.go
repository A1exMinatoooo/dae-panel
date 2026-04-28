package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"os"
	"strings"

	"github.com/daeuniverse/dae-panel/internal/api"
	"github.com/daeuniverse/dae-panel/internal/config"
	"github.com/daeuniverse/dae-panel/internal/service"
)

//go:embed web/dist/*
var staticFiles embed.FS

func main() {
	if len(os.Args) > 1 && !strings.HasPrefix(os.Args[1], "-") {
		switch os.Args[1] {
		case "install":
			if err := service.Install(); err != nil {
				log.Fatalf("Failed to install service: %v\n", err)
			}
			fmt.Println("dae-panel service installed successfully.")
			return
		case "uninstall":
			if err := service.Uninstall(); err != nil {
				log.Fatalf("Failed to uninstall service: %v\n", err)
			}
			fmt.Println("dae-panel service uninstalled successfully.")
			return
		case "serve":
			// fall through to default serve behavior
		default:
			fmt.Fprintf(os.Stderr, "Usage: dae-panel [install|uninstall|serve]\n")
			fmt.Fprintf(os.Stderr, "\nCommands:\n")
			fmt.Fprintf(os.Stderr, "  install    Install dae-panel as a systemd service\n")
			fmt.Fprintf(os.Stderr, "  uninstall  Uninstall dae-panel systemd service\n")
			fmt.Fprintf(os.Stderr, "  serve      Start the web server (default)\n")
			os.Exit(1)
		}
	}

	port := flag.Int("port", 8080, "HTTP server port")
	configPath := flag.String("config", "/etc/dae/config.dae", "Path to dae config file")
	username := flag.String("username", "admin", "Basic auth username")
	password := flag.String("password", "dae-panel", "Basic auth password")
	flag.Parse()

	cfg := &config.PanelConfig{
		Port:       *port,
		ConfigPath: *configPath,
		Username:   *username,
		Password:   *password,
	}

	if v := os.Getenv("DAE_PANEL_PORT"); v != "" {
		fmt.Sscanf(v, "%d", &cfg.Port)
	}
	if v := os.Getenv("DAE_PANEL_CONFIG"); v != "" {
		cfg.ConfigPath = v
	}
	if v := os.Getenv("DAE_PANEL_USERNAME"); v != "" {
		cfg.Username = v
	}
	if v := os.Getenv("DAE_PANEL_PASSWORD"); v != "" {
		cfg.Password = v
	}

	// Try to use embedded files, fall back to nil (API-only mode)
	var staticFS fs.FS
	if _, err := staticFiles.ReadDir("web/dist"); err == nil {
		staticFS = staticFiles
	} else {
		log.Println("Warning: Frontend not built. Run 'make build-frontend' first. Serving API only.")
	}

	if err := api.Start(cfg, staticFS); err != nil {
		log.Fatalf("Server error: %v\n", err)
	}
}
