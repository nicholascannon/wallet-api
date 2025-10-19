package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

// Logger creates a structured logging middleware
func Logger(logger zerolog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)

		requestID, _ := c.Get(RequestIDKey)

		event := logger.Info().
			Str("request_id", requestID.(string)).
			Str("method", c.Request.Method).
			Str("path", path).
			Int("status", c.Writer.Status()).
			Dur("latency", latency).
			Str("ip", c.ClientIP()).
			Str("user_agent", c.Request.UserAgent())

		if raw != "" {
			event.Str("query", raw)
		}
		if len(c.Errors) > 0 {
			event.Strs("errors", c.Errors.Errors())
		}

		event.Send()
	}
}
