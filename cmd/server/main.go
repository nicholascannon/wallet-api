package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/nicholascannon/wallet-api/internal/controllers"
	"github.com/nicholascannon/wallet-api/internal/database"
	"github.com/nicholascannon/wallet-api/internal/repository"
	"github.com/nicholascannon/wallet-api/internal/service"
)

func main() {
	if err := database.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	router := gin.Default()

	walletRepo := repository.NewWalletRepository()
	walletService := service.NewWalletService(walletRepo)
	walletController := controllers.NewWalletController(walletService)

	v1 := router.Group("/v1")
	walletController.RegisterRoutes(v1)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatal("Server failed:", err)
	}
}
