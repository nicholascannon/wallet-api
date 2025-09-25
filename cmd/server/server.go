package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func createServer() http.Handler {
	router := gin.Default()

	router.GET("/hello", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "world"})
	})

	return router
}
