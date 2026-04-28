package api

import (
	"net/http"

	"github.com/daeuniverse/dae-panel/internal/config"
	"github.com/daeuniverse/dae-panel/internal/dae"
	"github.com/gin-gonic/gin"
)

func handleGetConfig(cfg *config.PanelConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		content, err := dae.ReadConfig(cfg.ConfigPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"path":    cfg.ConfigPath,
			"content": content,
		})
	}
}

func handlePutConfig(cfg *config.PanelConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Content string `json:"content" binding:"required"`
			Reload  bool   `json:"reload"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := dae.WriteConfig(cfg.ConfigPath, req.Content); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		result := gin.H{"message": "Config saved"}
		if req.Reload {
			out, err := dae.Reload()
			if err != nil {
				result["reload_error"] = err.Error()
			} else {
				result["reload_output"] = out
			}
		}

		c.JSON(http.StatusOK, result)
	}
}

func handleValidateConfig(cfg *config.PanelConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		output, err := dae.ValidateConfig(cfg.ConfigPath)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"valid":  false,
				"output": output,
				"error":  err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"valid":  true,
			"output": output,
		})
	}
}
