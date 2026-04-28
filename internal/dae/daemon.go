package dae

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
)

const pidFile = "/var/run/dae.pid"

type DaemonStatus struct {
	Running   bool   `json:"running"`
	Suspended bool   `json:"suspended"`
	PID       int    `json:"pid,omitempty"`
}

func GetStatus() DaemonStatus {
	data, err := os.ReadFile(pidFile)
	if err != nil {
		return DaemonStatus{Running: false}
	}
	pidStr := strings.TrimSpace(string(data))
	pid, err := strconv.Atoi(pidStr)
	if err != nil {
		return DaemonStatus{Running: false}
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return DaemonStatus{Running: false}
	}
	if err := proc.Signal(syscall.Signal(0)); err != nil {
		return DaemonStatus{Running: false}
	}
	return DaemonStatus{Running: true, PID: pid}
}

func Reload() (string, error) {
	return runCommand("dae", "reload")
}

func Suspend() (string, error) {
	return runCommand("dae", "suspend")
}

func SendSignal(sig syscall.Signal) error {
	data, err := os.ReadFile(pidFile)
	if err != nil {
		return fmt.Errorf("read pid file: %w", err)
	}
	pidStr := strings.TrimSpace(string(data))
	pid, err := strconv.Atoi(pidStr)
	if err != nil {
		return fmt.Errorf("parse pid: %w", err)
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return fmt.Errorf("find process: %w", err)
	}
	return proc.Signal(sig)
}

func GetVersion() (string, error) {
	return runCommand("dae", "version")
}

func GetConfigPath() string {
	candidates := []string{
		"/etc/dae/config.dae",
		"/etc/dae/dae.dae",
	}
	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

func GetSubFiles(configPath string) ([]string, error) {
	dir := filepath.Dir(configPath)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	var files []string
	for _, e := range entries {
		if !e.IsDir() && (filepath.Ext(e.Name()) == ".dae" || filepath.Ext(e.Name()) == ".sub") {
			files = append(files, filepath.Join(dir, e.Name()))
		}
	}
	return files, nil
}

func runCommand(name string, args ...string) (string, error) {
	cmd := exec.Command(name, args...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return string(out), fmt.Errorf("%s: %w\n%s", name, err, string(out))
	}
	return string(out), nil
}
