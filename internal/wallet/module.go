package wallet

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes sets up all wallet domain routes and dependencies
func RegisterRoutes(router *gin.RouterGroup) {
	walletRepo := newRepository()
	walletService := newService(walletRepo)
	walletHandler := newHandler(walletService)

	walletHandler.RegisterRoutes(router)
}
