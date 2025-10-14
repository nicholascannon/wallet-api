package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.GET("/hello", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "world"})
	})

	if err := http.ListenAndServe(":8080", router); err != nil {
		fmt.Printf("Server failed: %s\n", err)
	}
}
