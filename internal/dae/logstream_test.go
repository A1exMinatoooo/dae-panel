package dae

import (
	"encoding/json"
	"testing"
)

func TestParseLogMessage(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name        string
		raw         string
		wantLevel   string
		wantMessage string
	}{
		{name: "trace", raw: " TRACE routed packet", wantLevel: "trace", wantMessage: "routed packet"},
		{name: "debug", raw: "DEBUG Configured transparent huge pages", wantLevel: "debug", wantMessage: "Configured transparent huge pages"},
		{name: "info", raw: " INFO Include config files", wantLevel: "info", wantMessage: "Include config files"},
		{name: "warn", raw: " WARN DNS forward to upstream failed", wantLevel: "warn", wantMessage: "DNS forward to upstream failed"},
		{name: "warning alias", raw: "warning: deprecated setting", wantLevel: "warn", wantMessage: "deprecated setting"},
		{name: "error", raw: "ERROR listener failed", wantLevel: "error", wantMessage: "listener failed"},
		{name: "fatal folds to error", raw: "FATAL startup failed", wantLevel: "error", wantMessage: "startup failed"},
		{name: "panic folds to error", raw: "PANIC invariant violated", wantLevel: "error", wantMessage: "invariant violated"},
		{name: "timestamped prefix", raw: "[2026-10-01 09:10:11]  WARN timed out", wantLevel: "warn", wantMessage: "timed out"},
		{name: "legacy prefix", raw: `level=warning msg="timed out" outbound=direct`, wantLevel: "warn", wantMessage: `msg="timed out" outbound=direct`},
		{name: "legacy timestamp", raw: `time="2026-10-01 09:10:11" level=debug msg="route"`, wantLevel: "debug", wantMessage: `msg="route"`},
		{name: "embedded legacy level", raw: `request failed level=ERROR outbound=direct`, wantLevel: "error", wantMessage: `request failed level=ERROR outbound=direct`},
		{name: "unknown level", raw: "NOTICE service changed", wantLevel: "unknown", wantMessage: "NOTICE service changed"},
		{name: "systemd lifecycle", raw: "Starting dae.service...", wantLevel: "unknown", wantMessage: "Starting dae.service..."},
		{name: "multiline continuation", raw: "domain(example.com) -> proxy", wantLevel: "unknown", wantMessage: "domain(example.com) -> proxy"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			gotLevel, gotMessage := parseLogMessage(tt.raw)
			if gotLevel != tt.wantLevel {
				t.Errorf("level = %q, want %q", gotLevel, tt.wantLevel)
			}
			if gotMessage != tt.wantMessage {
				t.Errorf("message = %q, want %q", gotMessage, tt.wantMessage)
			}
		})
	}
}

func TestParseJournalEntryPreservesRawMessage(t *testing.T) {
	t.Parallel()

	raw := []byte(`{"__REALTIME_TIMESTAMP":"1790787344210571","MESSAGE":" WARN DNS forward to upstream failed","PRIORITY":"6"}`)
	entry, err := parseJournalEntry(raw)
	if err != nil {
		t.Fatalf("parseJournalEntry() error = %v", err)
	}

	if entry.Time != "1790787344210571" {
		t.Errorf("Time = %q", entry.Time)
	}
	if entry.Message != " WARN DNS forward to upstream failed" {
		t.Errorf("Message = %q", entry.Message)
	}
	if entry.DisplayMessage != "DNS forward to upstream failed" {
		t.Errorf("DisplayMessage = %q", entry.DisplayMessage)
	}
	if entry.Level != "warn" {
		t.Errorf("Level = %q", entry.Level)
	}

	encoded, err := json.Marshal(entry)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	var wire map[string]string
	if err := json.Unmarshal(encoded, &wire); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}
	if wire["MESSAGE"] != entry.Message {
		t.Errorf("wire MESSAGE = %q, want raw message", wire["MESSAGE"])
	}
	if wire["message"] != entry.DisplayMessage {
		t.Errorf("wire message = %q, want display message", wire["message"])
	}
	if wire["level"] != entry.Level {
		t.Errorf("wire level = %q, want %q", wire["level"], entry.Level)
	}
}
