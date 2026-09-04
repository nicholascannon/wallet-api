package server

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog/log"
)

// Server wraps http.Server with lifecycle management
type Server struct {
	httpServer *http.Server
	shutdown   chan struct{}
}

// New creates a new server instance
func New(addr string, handler http.Handler) *Server {
	return &Server{
		httpServer: &http.Server{
			Addr:    addr,
			Handler: handler,
		},
		shutdown: make(chan struct{}),
	}
}

// Run starts the server and blocks until shutdown signal
func (s *Server) Run(shutdownTimeout time.Duration) error {
	go func() {
		log.Info().Str("addr", s.httpServer.Addr).Msg("Starting server")
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Server failed to start")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case <-quit:
		log.Info().Msg("Shutdown signal received")
	case <-s.shutdown:
		log.Info().Msg("Shutdown requested")
	}

	// Start graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	log.Info().Msg("Shutting down server...")
	if err := s.httpServer.Shutdown(ctx); err != nil {
		return fmt.Errorf("server shutdown failed: %w", err)
	}

	log.Info().Msg("Server stopped")
	return nil
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown() {
	close(s.shutdown)
}
