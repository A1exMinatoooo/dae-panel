package dae

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"regexp"
	"strings"
	"sync"
	"time"
)

type LogEntry struct {
	Time           string `json:"__REALTIME_TIMESTAMP"`
	Message        string `json:"MESSAGE"`
	DisplayMessage string `json:"message"`
	Level          string `json:"level"`
}

var (
	daeLevelPrefixRegex = regexp.MustCompile(`(?i)^\s*(?:\[[^\]\r\n]+\]\s*)?(trace|debug|info|warn(?:ing)?|error|fatal|panic)\b(?:\s*(?::|-)\s*|\s+)?`)
	legacyLevelRegex    = regexp.MustCompile(`(?i)\blevel\s*=\s*"?([a-z]+)"?`)
	legacyPrefixRegex   = regexp.MustCompile(`(?i)^\s*(?:time=(?:"[^"]*"|\S+)\s+)?level\s*=\s*"?[a-z]+"?\s*`)
)

type LogBroadcaster struct {
	mu      sync.RWMutex
	clients map[chan LogEntry]struct{}
	running bool
	cancel  context.CancelFunc
}

func NewLogBroadcaster() *LogBroadcaster {
	return &LogBroadcaster{
		clients: make(map[chan LogEntry]struct{}),
	}
}

func (lb *LogBroadcaster) Subscribe() chan LogEntry {
	ch := make(chan LogEntry, 100)
	lb.mu.Lock()
	lb.clients[ch] = struct{}{}
	lb.mu.Unlock()
	return ch
}

func (lb *LogBroadcaster) Unsubscribe(ch chan LogEntry) {
	lb.mu.Lock()
	delete(lb.clients, ch)
	lb.mu.Unlock()
	close(ch)
}

func (lb *LogBroadcaster) Start(ctx context.Context) error {
	lb.mu.Lock()
	if lb.running {
		lb.mu.Unlock()
		return nil
	}
	lb.running = true
	ctx, lb.cancel = context.WithCancel(ctx)
	lb.mu.Unlock()

	go lb.stream(ctx)
	return nil
}

func (lb *LogBroadcaster) Stop() {
	lb.mu.Lock()
	if lb.cancel != nil {
		lb.cancel()
	}
	lb.running = false
	lb.mu.Unlock()
}

func (lb *LogBroadcaster) stream(ctx context.Context) {
	defer func() {
		lb.mu.Lock()
		lb.running = false
		lb.mu.Unlock()
	}()

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		cmd := exec.CommandContext(ctx, "journalctl",
			"-u", "dae",
			"-f",
			"--output=json",
			"--no-pager",
			"-n", "0",
		)
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			time.Sleep(3 * time.Second)
			continue
		}

		if err := cmd.Start(); err != nil {
			time.Sleep(3 * time.Second)
			continue
		}

		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			select {
			case <-ctx.Done():
				cmd.Process.Kill()
				return
			default:
			}

			entry, err := parseJournalEntry(scanner.Bytes())
			if err != nil {
				continue
			}

			lb.mu.RLock()
			for ch := range lb.clients {
				select {
				case ch <- entry:
				default:
				}
			}
			lb.mu.RUnlock()
		}
		cmd.Wait()
		time.Sleep(2 * time.Second)
	}
}

func parseLogMessage(raw string) (level, message string) {
	if matches := daeLevelPrefixRegex.FindStringSubmatchIndex(raw); matches != nil {
		return normalizeLevel(raw[matches[2]:matches[3]]), strings.TrimSpace(raw[matches[1]:])
	}

	if matches := legacyLevelRegex.FindStringSubmatch(raw); len(matches) >= 2 {
		level = normalizeLevel(matches[1])
		if level == "unknown" {
			return level, raw
		}
		if prefix := legacyPrefixRegex.FindStringIndex(raw); prefix != nil {
			return level, strings.TrimSpace(raw[prefix[1]:])
		}
		return level, raw
	}

	return "unknown", raw
}

func normalizeLevel(level string) string {
	switch strings.ToLower(level) {
	case "fatal", "panic", "error":
		return "error"
	case "warn", "warning":
		return "warn"
	case "info":
		return "info"
	case "debug":
		return "debug"
	case "trace":
		return "trace"
	default:
		return "unknown"
	}
}

func parseJournalEntry(data []byte) (LogEntry, error) {
	var entry LogEntry
	if err := json.Unmarshal(data, &entry); err != nil {
		return LogEntry{}, err
	}
	entry.Level, entry.DisplayMessage = parseLogMessage(entry.Message)
	return entry, nil
}

func GetRecentLogs(n int) ([]LogEntry, error) {
	cmd := exec.Command("journalctl",
		"-u", "dae",
		"--output=json",
		"--no-pager",
		"-n", fmt.Sprintf("%d", n),
	)
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	var entries []LogEntry
	for _, line := range splitLines(string(out)) {
		if line == "" {
			continue
		}
		entry, err := parseJournalEntry([]byte(line))
		if err != nil {
			continue
		}
		entries = append(entries, entry)
	}
	return entries, nil
}

func splitLines(s string) []string {
	var lines []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			lines = append(lines, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}
