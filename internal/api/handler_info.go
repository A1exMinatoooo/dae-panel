package api

import (
	"net/http"
	"runtime"

	"github.com/daeuniverse/dae-panel/internal/config"
	"github.com/daeuniverse/dae-panel/internal/dae"
	"github.com/gin-gonic/gin"
)

func handleInfo(cfg *config.PanelConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		version, _ := dae.GetVersion()
		status := dae.GetStatus()

		var uptime string
		if status.Running && status.PID > 0 {
			uptime, _ = dae.GetProcessUptime(status.PID)
		}

		c.JSON(http.StatusOK, gin.H{
			"version":     version,
			"go_version":  runtime.Version(),
			"os":          runtime.GOOS,
			"arch":        runtime.GOARCH,
			"uptime":      uptime,
			"config_path": cfg.ConfigPath,
			"dae_version": version,
		})
	}
}

var handleStatus = func(c *gin.Context) {
	status := dae.GetStatus()
	c.JSON(http.StatusOK, status)
}
