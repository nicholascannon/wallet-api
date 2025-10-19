package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nicholascannon/wallet-api/internal/database"
)

// RegisterRoutes registers health check endpoints
func RegisterRoutes(router *gin.RouterGroup) {
	health := router.Group("/health")
	{
		health.GET("/live", Live)
		health.GET("/ready", Ready)
	}
}

// Live returns a simple liveness check
func Live(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "alive",
	})
}

// Ready checks if the service is ready to handle requests
func Ready(c *gin.Context) {
	if database.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"reason": "database not connected",
		})
		return
	}

	sqlDB, err := database.DB.DB()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"reason": "failed to get database connection",
		})
		return
	}

	if err := sqlDB.Ping(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"reason": "database ping failed",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "ready",
	})
}
