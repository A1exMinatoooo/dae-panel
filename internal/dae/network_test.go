package dae

import (
	"os"
	"path/filepath"
	"testing"
)

func TestNetworkTrafficSources(t *testing.T) {
	tempDir := t.TempDir()
	sysClass := filepath.Join(tempDir, "net")
	for _, iface := range []string{"eth0", "lan0", "lo"} {
		statsDir := filepath.Join(sysClass, iface, "statistics")
		if err := os.MkdirAll(statsDir, 0o755); err != nil {
			t.Fatal(err)
		}
		writeTestFile(t, filepath.Join(sysClass, iface, "operstate"), "up\n")
		writeTestFile(t, filepath.Join(statsDir, "rx_bytes"), "4096\n")
		writeTestFile(t, filepath.Join(statsDir, "tx_bytes"), "2048\n")
	}
	routePath := filepath.Join(tempDir, "route")
	writeTestFile(t, routePath, "Iface\tDestination\tGateway\tFlags\neth0\t00000000\t01010101\t0003\n")
	conntrackPath := filepath.Join(tempDir, "conntrack_count")
	writeTestFile(t, conntrackPath, "37\n")

	originalSysClass := networkSysClassPath
	originalRoute := networkRoutePath
	originalConntrack := conntrackCountPath
	networkSysClassPath = sysClass
	networkRoutePath = routePath
	conntrackCountPath = conntrackPath
	t.Cleanup(func() {
		networkSysClassPath = originalSysClass
		networkRoutePath = originalRoute
		conntrackCountPath = originalConntrack
	})

	interfaces, err := ListNetworkInterfaces()
	if err != nil {
		t.Fatal(err)
	}
	if len(interfaces) != 2 || interfaces[0].Name != "eth0" || interfaces[1].Name != "lan0" {
		t.Fatalf("unexpected interfaces: %#v", interfaces)
	}

	selected, source, err := ResolveTrafficInterface("auto")
	if err != nil {
		t.Fatal(err)
	}
	if selected != "eth0" || source != "default_route" {
		t.Fatalf("unexpected interface selection: %q (%s)", selected, source)
	}

	snapshot, err := GetTrafficSnapshot(selected)
	if err != nil {
		t.Fatal(err)
	}
	if snapshot.RXBytes != 4096 || snapshot.TXBytes != 2048 {
		t.Fatalf("unexpected counters: %#v", snapshot)
	}
	if snapshot.ActiveConnections == nil || *snapshot.ActiveConnections != 37 {
		t.Fatalf("unexpected conntrack count: %#v", snapshot.ActiveConnections)
	}
}

func TestResolveTrafficInterfaceRejectsUnknownInterface(t *testing.T) {
	tempDir := t.TempDir()
	originalSysClass := networkSysClassPath
	networkSysClassPath = tempDir
	t.Cleanup(func() { networkSysClassPath = originalSysClass })

	if _, _, err := ResolveTrafficInterface("missing0"); err == nil {
		t.Fatal("expected unknown interface error")
	}
}

func writeTestFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}
