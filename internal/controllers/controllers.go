package controllers

import "github.com/gin-gonic/gin"

func RegisterControllers(router *gin.RouterGroup) {
	wc := NewWalletController()
	wc.RegisterRoutes(router)
}
