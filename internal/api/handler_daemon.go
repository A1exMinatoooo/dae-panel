package api

import (
	"net/http"

	"github.com/daeuniverse/dae-panel/internal/dae"
	"github.com/gin-gonic/gin"
)

var handleReload = func(c *gin.Context) {
	out, err := dae.Reload()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  err.Error(),
			"output": out,
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Reloaded successfully",
		"output":  out,
	})
}

var handleSuspend = func(c *gin.Context) {
	out, err := dae.Suspend()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  err.Error(),
			"output": out,
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Suspended successfully",
		"output":  out,
	})
}

var handleResume = func(c *gin.Context) {
	out, err := dae.Reload()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  err.Error(),
			"output": out,
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Resumed successfully",
		"output":  out,
	})
}
