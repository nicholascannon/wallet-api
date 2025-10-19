package database

import (
	"context"
	"errors"
	"time"

	"github.com/rs/zerolog"
	"gorm.io/gorm/logger"
)

// GormLogger implements gorm's logger.Interface using zerolog
type GormLogger struct {
	zerolog.Logger
	SlowThreshold time.Duration
}

// NewGormLogger creates a new GORM logger using zerolog
func NewGormLogger(log zerolog.Logger, slowThreshold time.Duration) logger.Interface {
	return &GormLogger{
		Logger:        log,
		SlowThreshold: slowThreshold,
	}
}

// LogMode implements logger.Interface
func (l *GormLogger) LogMode(level logger.LogLevel) logger.Interface {
	switch level {
	case logger.Silent:
		return &GormLogger{Logger: l.Logger.Level(zerolog.Disabled)}
	case logger.Error:
		return &GormLogger{Logger: l.Logger.Level(zerolog.ErrorLevel)}
	case logger.Warn:
		return &GormLogger{Logger: l.Logger.Level(zerolog.WarnLevel)}
	case logger.Info:
		return &GormLogger{Logger: l.Logger.Level(zerolog.InfoLevel)}
	default:
		return l
	}
}

// Info implements logger.Interface
func (l *GormLogger) Info(ctx context.Context, msg string, data ...interface{}) {
	l.Logger.Info().Msgf(msg, data...)
}

// Warn implements logger.Interface
func (l *GormLogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	l.Logger.Warn().Msgf(msg, data...)
}

// Error implements logger.Interface
func (l *GormLogger) Error(ctx context.Context, msg string, data ...interface{}) {
	l.Logger.Error().Msgf(msg, data...)
}

// Trace implements logger.Interface
func (l *GormLogger) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	elapsed := time.Since(begin)

	// Get SQL and rows affected
	sql, rows := fc()

	event := l.Logger.Trace().
		Dur("elapsed", elapsed).
		Str("sql", sql).
		Int64("rows", rows)

	if err != nil && !errors.Is(err, logger.ErrRecordNotFound) {
		event.Err(err)
	}

	// Log slow queries as warnings
	if elapsed >= l.SlowThreshold && l.SlowThreshold != 0 {
		l.Logger.Warn().
			Dur("elapsed", elapsed).
			Str("sql", sql).
			Int64("rows", rows).
			Msg("Slow SQL query")
	} else {
		event.Send()
	}
}
