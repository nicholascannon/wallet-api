package logger

import (
	"fmt"
	"os"

	"github.com/nicholascannon/wallet-api/internal/config"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// New creates a new logger instance with the given configuration
func New(cfg *config.LoggingConfig) zerolog.Logger {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// Setup output (console for development, JSON for production)
	logger := log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	level, err := zerolog.ParseLevel(cfg.Level)
	if err != nil {
		panic(fmt.Errorf("invalid LOG_LEVEL %q: %w", cfg.Level, err))
	}
	zerolog.SetGlobalLevel(level)

	return logger
}
