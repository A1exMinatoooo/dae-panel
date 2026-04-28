package api

import (
	"net/http"
	"runtime"
	"time"

	"github.com/daeuniverse/dae-panel/internal/config"
	"github.com/daeuniverse/dae-panel/internal/dae"
	"github.com/gin-gonic/gin"
)

var startTime = time.Now()

func handleInfo(cfg *config.PanelConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		version, _ := dae.GetVersion()
		c.JSON(http.StatusOK, gin.H{
			"version":       version,
			"go_version":    runtime.Version(),
			"os":            runtime.GOOS,
			"arch":          runtime.GOARCH,
			"uptime":        time.Since(startTime).String(),
			"config_path":   cfg.ConfigPath,
			"dae_version":   version,
		})
	}
}

var handleStatus = func(c *gin.Context) {
	status := dae.GetStatus()
	c.JSON(http.StatusOK, status)
}
