package logger

import (
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
		logger.Fatal().Err(err).Msg("Invalid log level")
	}
	zerolog.SetGlobalLevel(level)

	return logger
}

// NewJSON creates a new logger that outputs JSON (for production)
func NewJSON(cfg *config.LoggingConfig) zerolog.Logger {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	logger := log.Output(os.Stderr)

	level, err := zerolog.ParseLevel(cfg.Level)
	if err != nil {
		logger.Fatal().Err(err).Msg("Invalid log level")
	}
	zerolog.SetGlobalLevel(level)

	return logger
}
