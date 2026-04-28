package dae

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"sync"
	"time"
)

type LogEntry struct {
	Time    string `json:"__REALTIME_TIMESTAMP"`
	Message string `json:"MESSAGE"`
	Level   string `json:"PRIORITY"`
}

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

			line := scanner.Text()
			var entry LogEntry
			if err := json.Unmarshal([]byte(line), &entry); err != nil {
				continue
			}
			entry.Level = priorityToLevel(entry.Level)

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

func priorityToLevel(p string) string {
	switch p {
	case "0", "1", "2":
		return "error"
	case "3":
		return "warning"
	case "4":
		return "info"
	case "5":
		return "notice"
	case "6":
		return "debug"
	default:
		return "info"
	}
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
		var entry LogEntry
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			continue
		}
		entry.Level = priorityToLevel(entry.Level)
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
