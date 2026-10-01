package api

import (
	"net/http"
	"time"

	"github.com/daeuniverse/dae-panel/internal/dae"
	"github.com/gin-gonic/gin"
)

func handleNetworkInterfaces(c *gin.Context) {
	interfaces, err := dae.ListNetworkInterfaces()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
		return
	}
	selected, source, _ := dae.ResolveTrafficInterface("auto")
	c.JSON(http.StatusOK, gin.H{
		"interfaces":        interfaces,
		"default_interface": selected,
		"default_source":    source,
	})
}

func handleNetworkTraffic(c *gin.Context) {
	interfaceName, source, err := dae.ResolveTrafficInterface(c.Query("interface"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	snapshot, err := dae.GetTrafficSnapshot(interfaceName)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"available": false,
			"interface": interfaceName,
			"error":     err.Error(),
			"timestamp": time.Now().UnixMilli(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"available":          true,
		"interface":          snapshot.Interface,
		"interface_source":   source,
		"rx_bytes":           snapshot.RXBytes,
		"tx_bytes":           snapshot.TXBytes,
		"active_connections": snapshot.ActiveConnections,
		"timestamp":           time.Now().UnixMilli(),
	})
}
