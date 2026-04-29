package api

import (
	"net/http"
	"runtime"

	"github.com/daeuniverse/dae-panel/internal/config"
	"github.com/daeuniverse/dae-panel/internal/dae"
	"github.com/daeuniverse/dae-panel/internal/version"
	"github.com/gin-gonic/gin"
)

func handleInfo(cfg *config.PanelConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		daeVersion, _ := dae.GetVersion()
		status := dae.GetStatus()

		var uptime string
		if status.Running && status.PID > 0 {
			uptime, _ = dae.GetProcessUptime(status.PID)
		}

		c.JSON(http.StatusOK, gin.H{
			"panel_version": version.Version,
			"dae_version":   daeVersion,
			"go_version":    runtime.Version(),
			"os":            runtime.GOOS,
			"arch":          runtime.GOARCH,
			"uptime":        uptime,
			"config_path":   cfg.ConfigPath,
		})
	}
}

var handleStatus = func(c *gin.Context) {
	status := dae.GetStatus()
	c.JSON(http.StatusOK, status)
}
