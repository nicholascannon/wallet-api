package main

import (
	"github.com/gin-gonic/gin"
	"github.com/nicholascannon/wallet-api/internal/config"
	"github.com/nicholascannon/wallet-api/internal/database"
	"github.com/nicholascannon/wallet-api/internal/health"
	"github.com/nicholascannon/wallet-api/internal/logger"
	"github.com/nicholascannon/wallet-api/internal/middleware"
	"github.com/nicholascannon/wallet-api/internal/server"
	"github.com/nicholascannon/wallet-api/internal/wallet"
	"github.com/rs/zerolog/log"
)

func main() {
	cfg := config.Load()
	log.Logger = logger.New(&cfg.Logging)

	if err := database.Connect(&cfg.Database); err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}

	router := gin.New()
	router.Use(
		middleware.RequestID(),
		middleware.Logger(),
		middleware.Recovery(),
		middleware.Timeout(cfg.Server.RequestTimeout),
	)

	v1 := router.Group("/v1")
	wallet.RegisterRoutes(v1)
	health.RegisterRoutes(v1)

	srv := server.New(":"+cfg.Server.Port, router)
	if err := srv.Run(cfg.Server.ShutdownTimeout); err != nil {
		log.Fatal().Err(err).Msg("Server failed")
	}

	if err := database.Close(); err != nil {
		log.Error().Err(err).Msg("Failed to close database connection")
	}
}
