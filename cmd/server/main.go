package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.GET("/hello", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "world"})
	})

	port := ":" + os.Getenv("PORT")

	if err := http.ListenAndServe(port, router); err != nil {
		fmt.Printf("Server failed: %s\n", err)
	}
}
