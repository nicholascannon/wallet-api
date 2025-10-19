package middleware

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
)

// Timeout creates a request timeout middleware
func Timeout(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)

		done := make(chan struct{})
		go func() {
			c.Next()
			close(done)
		}()

		select {
		case <-done:
			// Request completed normally
		case <-ctx.Done():
			// Request timed out
			c.JSON(408, gin.H{
				"error": "Request timeout",
			})
			c.Abort()
		}
	}
}
