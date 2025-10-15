package controllers

import "github.com/gin-gonic/gin"

type Controller interface {
	RegisterRoutes(router *gin.RouterGroup)
}

func RegisterControllers(router *gin.RouterGroup) {
	controllers := [...]Controller{NewWalletController()}

	for _, c := range controllers {
		c.RegisterRoutes(router)
	}
}
