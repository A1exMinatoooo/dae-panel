package dae

import (
	"fmt"
	"os"
	"path/filepath"
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

func ValidateConfig(path string) (string, error) {
	return runCommand("dae", "validate", "-c", path)
}
