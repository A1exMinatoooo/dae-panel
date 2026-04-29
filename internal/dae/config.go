package dae

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

func ReadConfig(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("read config: %w", err)
	}
	return string(data), nil
}

func WriteConfig(path, content string) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("create config dir: %w", err)
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		return fmt.Errorf("write config: %w", err)
	}
	return nil
}

// BackupConfig creates a timestamped backup of the config file.
func BackupConfig(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("read config for backup: %w", err)
	}
	backupPath := path + ".bak." + time.Now().Format("20060102150405")
	if err := os.WriteFile(backupPath, data, 0644); err != nil {
		return "", fmt.Errorf("write backup: %w", err)
	}
	return backupPath, nil
}

// ValidateContent validates config content by writing to a temp file first.
func ValidateContent(content string) (string, error) {
	tmpFile, err := os.CreateTemp("", "dae-validate-*.dae")
	if err != nil {
		return "", fmt.Errorf("create temp file: %w", err)
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(content); err != nil {
		tmpFile.Close()
		return "", fmt.Errorf("write temp file: %w", err)
	}
	tmpFile.Close()

	return runCommand("dae", "validate", "-c", tmpFile.Name())
}

// ValidateConfig validates an existing config file.
func ValidateConfig(path string) (string, error) {
	return runCommand("dae", "validate", "-c", path)
}
