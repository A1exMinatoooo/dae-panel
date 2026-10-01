package dae

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

var (
	networkSysClassPath = "/sys/class/net"
	networkRoutePath    = "/proc/net/route"
	conntrackCountPath  = "/proc/sys/net/netfilter/nf_conntrack_count"
)

type NetworkInterface struct {
	Name      string `json:"name"`
	OperState string `json:"oper_state"`
}

type TrafficSnapshot struct {
	Interface         string  `json:"interface"`
	RXBytes           uint64  `json:"rx_bytes"`
	TXBytes           uint64  `json:"tx_bytes"`
	ActiveConnections *uint64 `json:"active_connections"`
}

func ListNetworkInterfaces() ([]NetworkInterface, error) {
	entries, err := os.ReadDir(networkSysClassPath)
	if err != nil {
		return nil, fmt.Errorf("read network interfaces: %w", err)
	}

	interfaces := make([]NetworkInterface, 0, len(entries))
	for _, entry := range entries {
		if entry.Name() == "lo" {
			continue
		}
		state := strings.TrimSpace(string(readFile(filepath.Join(networkSysClassPath, entry.Name(), "operstate"))))
		if state == "" {
			state = "unknown"
		}
		interfaces = append(interfaces, NetworkInterface{Name: entry.Name(), OperState: state})
	}

	sort.Slice(interfaces, func(i, j int) bool {
		return interfaces[i].Name < interfaces[j].Name
	})
	return interfaces, nil
}

func GetDefaultRouteInterface() (string, error) {
	file, err := os.Open(networkRoutePath)
	if err != nil {
		return "", fmt.Errorf("open route table: %w", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 4 || fields[0] == "Iface" {
			continue
		}
		flags, err := strconv.ParseUint(fields[3], 16, 64)
		if err == nil && fields[1] == "00000000" && flags&0x1 != 0 {
			return fields[0], nil
		}
	}
	if err := scanner.Err(); err != nil {
		return "", fmt.Errorf("read route table: %w", err)
	}
	return "", errors.New("default route interface not found")
}

func ResolveTrafficInterface(requested string) (string, string, error) {
	interfaces, err := ListNetworkInterfaces()
	if err != nil {
		return "", "", err
	}
	available := make(map[string]struct{}, len(interfaces))
	for _, iface := range interfaces {
		available[iface.Name] = struct{}{}
	}

	if requested != "" && requested != "auto" {
		if _, ok := available[requested]; !ok {
			return "", "", fmt.Errorf("network interface %q not found", requested)
		}
		return requested, "requested", nil
	}

	if iface, err := GetDefaultRouteInterface(); err == nil {
		if _, ok := available[iface]; ok {
			return iface, "default_route", nil
		}
	}
	if len(interfaces) > 0 {
		return interfaces[0].Name, "fallback", nil
	}
	return "", "", errors.New("no non-loopback network interface found")
}

func GetTrafficSnapshot(interfaceName string) (TrafficSnapshot, error) {
	if interfaceName == "" || filepath.Base(interfaceName) != interfaceName {
		return TrafficSnapshot{}, errors.New("invalid network interface")
	}
	rxBytes, err := readUintFile(filepath.Join(networkSysClassPath, interfaceName, "statistics", "rx_bytes"))
	if err != nil {
		return TrafficSnapshot{}, fmt.Errorf("read receive counter: %w", err)
	}
	txBytes, err := readUintFile(filepath.Join(networkSysClassPath, interfaceName, "statistics", "tx_bytes"))
	if err != nil {
		return TrafficSnapshot{}, fmt.Errorf("read transmit counter: %w", err)
	}

	snapshot := TrafficSnapshot{Interface: interfaceName, RXBytes: rxBytes, TXBytes: txBytes}
	if count, err := readUintFile(conntrackCountPath); err == nil {
		snapshot.ActiveConnections = &count
	}
	return snapshot, nil
}

func readUintFile(path string) (uint64, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return 0, err
	}
	value, err := strconv.ParseUint(strings.TrimSpace(string(data)), 10, 64)
	if err != nil {
		return 0, fmt.Errorf("parse counter: %w", err)
	}
	return value, nil
}
