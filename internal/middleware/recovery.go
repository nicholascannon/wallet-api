package middleware

import (
	"net/http"
	"runtime"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

// Recovery creates a panic recovery middleware with structured logging
func Recovery(logger zerolog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				requestID, _ := c.Get(RequestIDKey)

				stack := make([]byte, 4096)
				length := runtime.Stack(stack, false)

				logger.Error().
					Str("request_id", requestID.(string)).
					Str("method", c.Request.Method).
					Str("path", c.Request.URL.Path).
					Str("ip", c.ClientIP()).
					Str("user_agent", c.Request.UserAgent()).
					Interface("panic", err).
					Str("stack", string(stack[:length])).
					Msg("Panic recovered")

				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Internal server error",
				})
			}
		}()

		c.Next()
	}
}
