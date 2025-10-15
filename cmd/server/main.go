package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/nicholascannon/wallet-api/internal/controllers"
)

func main() {
	router := gin.Default()

	v1 := router.Group("/v1")
	controllers.RegisterControllers(v1)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := http.ListenAndServe(":"+port, router); err != nil {
		fmt.Printf("Server failed: %s\n", err)
	}
}
