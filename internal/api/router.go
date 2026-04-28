package api

import (
	"encoding/base64"
	"fmt"
	"io/fs"
	"net/http"
	"strings"

	"github.com/daeuniverse/dae-panel/internal/config"
	"github.com/gin-gonic/gin"
)

func SetupRouter(cfg *config.PanelConfig, staticFiles fs.FS) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(corsMiddleware())

	r.GET("/api/info", handleInfo(cfg))
	r.GET("/api/status", handleStatus)

	auth := r.Group("/", basicAuth(cfg))
	{
		auth.GET("/api/config", handleGetConfig(cfg))
		auth.PUT("/api/config", handlePutConfig(cfg))
		auth.POST("/api/config/validate", handleValidateConfig(cfg))
		auth.POST("/api/reload", handleReload)
		auth.POST("/api/suspend", handleSuspend)
		auth.POST("/api/resume", handleResume)
		auth.GET("/api/logs/history", handleLogHistory)
	}

	sseAuth := r.Group("/", basicAuthFromQuery(cfg))
	{
		sseAuth.GET("/api/logs/stream", handleLogStream)
	}

	if staticFiles != nil {
		distFS, err := fs.Sub(staticFiles, "web/dist")
		if err == nil {
			r.NoRoute(func(c *gin.Context) {
				path := c.Request.URL.Path
				if strings.HasPrefix(path, "/api/") {
					c.JSON(404, gin.H{"error": "not found"})
					return
				}
				// Try to serve static file
				cleanPath := strings.TrimPrefix(path, "/")
				if cleanPath == "" {
					cleanPath = "index.html"
				}
				data, err := fs.ReadFile(distFS, cleanPath)
				if err == nil {
					c.Data(http.StatusOK, detectContentType(cleanPath), data)
					return
				}
				// SPA fallback: serve index.html
				data, err = fs.ReadFile(distFS, "index.html")
				if err == nil {
					c.Data(http.StatusOK, "text/html; charset=utf-8", data)
					return
				}
				c.JSON(404, gin.H{"error": "not found"})
			})
		}
	}

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func basicAuth(cfg *config.PanelConfig) gin.HandlerFunc {
	return gin.BasicAuth(gin.Accounts{
		cfg.Username: cfg.Password,
	})
}

func basicAuthFromQuery(cfg *config.PanelConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		authParam := c.Query("auth")
		if authParam != "" {
			decoded, err := base64.StdEncoding.DecodeString(authParam)
			if err == nil {
				parts := strings.SplitN(string(decoded), ":", 2)
				if len(parts) == 2 {
					if parts[0] == cfg.Username && parts[1] == cfg.Password {
						c.Next()
						return
					}
				}
			}
		}
		c.Header("WWW-Authenticate", "Basic realm=\"dae-panel\"")
		c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
	}
}

func Start(cfg *config.PanelConfig, staticFiles fs.FS) error {
	r := SetupRouter(cfg, staticFiles)
	return r.Run(fmt.Sprintf(":%d", cfg.Port))
}

func detectContentType(path string) string {
	switch {
	case strings.HasSuffix(path, ".html"):
		return "text/html; charset=utf-8"
	case strings.HasSuffix(path, ".css"):
		return "text/css; charset=utf-8"
	case strings.HasSuffix(path, ".js"):
		return "application/javascript; charset=utf-8"
	case strings.HasSuffix(path, ".json"):
		return "application/json"
	case strings.HasSuffix(path, ".svg"):
		return "image/svg+xml"
	case strings.HasSuffix(path, ".png"):
		return "image/png"
	case strings.HasSuffix(path, ".jpg"), strings.HasSuffix(path, ".jpeg"):
		return "image/jpeg"
	case strings.HasSuffix(path, ".ico"):
		return "image/x-icon"
	case strings.HasSuffix(path, ".woff2"):
		return "font/woff2"
	case strings.HasSuffix(path, ".woff"):
		return "font/woff"
	default:
		return "application/octet-stream"
	}
}
