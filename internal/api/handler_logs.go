package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/daeuniverse/dae-panel/internal/dae"
	"github.com/gin-gonic/gin"
)

var logBroadcaster = dae.NewLogBroadcaster()

func init() {
	logBroadcaster.Start(context.Background())
}

var handleLogStream = func(c *gin.Context) {
	ch := logBroadcaster.Subscribe()
	defer logBroadcaster.Unsubscribe(ch)

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	c.Writer.Flush()

	for {
		select {
		case entry, ok := <-ch:
			if !ok {
				return
			}
			data := fmt.Sprintf("data: %s\n\n", toJSON(entry))
			c.Writer.WriteString(data)
			c.Writer.Flush()
		case <-c.Request.Context().Done():
			return
		}
	}
}

var handleLogHistory = func(c *gin.Context) {
	nStr := c.DefaultQuery("n", "100")
	n, err := strconv.Atoi(nStr)
	if err != nil || n <= 0 {
		n = 100
	}
	if n > 1000 {
		n = 1000
	}

	entries, err := dae.GetRecentLogs(n)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"logs": entries})
}

func toJSON(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}
