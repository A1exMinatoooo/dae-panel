package service

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

const (
	serviceName = "dae-panel"
	unitContent = `[Unit]
Description=dae Panel - Web UI for dae proxy
After=network.target dae.service
Wants=dae.service

[Service]
Type=simple
EnvironmentFile=-/etc/dae-panel/dae-panel.env
ExecStart=/usr/local/bin/dae-panel serve
Restart=on-failure
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
`

	envContent = `DAE_PANEL_PORT=8080
DAE_PANEL_CONFIG=/etc/dae/config.dae
DAE_PANEL_USERNAME=admin
DAE_PANEL_PASSWORD=dae-panel
`

	unitPath  = "/etc/systemd/system/" + serviceName + ".service"
	binPath   = "/usr/local/bin/" + serviceName
	envDir    = "/etc/dae-panel"
	envPath   = envDir + "/dae-panel.env"
)

func Install() error {
	if runtime.GOOS != "linux" {
		return fmt.Errorf("service installation is only supported on Linux")
	}

	exe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("get executable path: %w", err)
	}

	exe, err = filepath.EvalSymlinks(exe)
	if err != nil {
		return fmt.Errorf("resolve symlink: %w", err)
	}

	if err := copyFile(exe, binPath); err != nil {
		return fmt.Errorf("copy binary: %w", err)
	}
	fmt.Printf("Copied binary to %s\n", binPath)

	if err := os.MkdirAll(envDir, 0755); err != nil {
		return fmt.Errorf("create config dir: %w", err)
	}

	if _, err := os.Stat(envPath); os.IsNotExist(err) {
		if err := os.WriteFile(envPath, []byte(envContent), 0644); err != nil {
			return fmt.Errorf("write env file: %w", err)
		}
		fmt.Printf("Created env file %s\n", envPath)
	} else {
		fmt.Printf("Env file %s already exists, skipping\n", envPath)
	}

	if err := os.WriteFile(unitPath, []byte(unitContent), 0644); err != nil {
		return fmt.Errorf("write service file: %w", err)
	}
	fmt.Printf("Created service file %s\n", unitPath)

	if err := run("systemctl", "daemon-reload"); err != nil {
		return fmt.Errorf("daemon-reload: %w", err)
	}
	if err := run("systemctl", "enable", serviceName); err != nil {
		return fmt.Errorf("enable service: %w", err)
	}

	fmt.Println("Service enabled. Start with: systemctl start dae-panel")
	return nil
}

func Uninstall() error {
	if runtime.GOOS != "linux" {
		return fmt.Errorf("service uninstallation is only supported on Linux")
	}

	run("systemctl", "stop", serviceName)
	run("systemctl", "disable", serviceName)

	if err := os.Remove(unitPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove service file: %w", err)
	}
	fmt.Printf("Removed %s\n", unitPath)

	run("systemctl", "daemon-reload")

	fmt.Printf("Env dir %s preserved. Remove manually if needed.\n", envDir)
	fmt.Printf("Binary %s preserved. Remove manually if needed.\n", binPath)
	return nil
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0755)
}

func run(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
