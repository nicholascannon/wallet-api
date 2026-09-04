package database

import (
	"context"
	"errors"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	gormlogger "gorm.io/gorm/logger"
)

type DbLogger struct {
	zerolog.Logger
	SlowThreshold time.Duration
}

// NewDbLogger creates a new GORM logger using zerolog
func NewDbLogger(slowThreshold time.Duration) gormlogger.Interface {
	return &DbLogger{
		Logger:        log.Logger,
		SlowThreshold: slowThreshold,
	}
}

func (dbLogger *DbLogger) LogMode(level gormlogger.LogLevel) gormlogger.Interface {
	switch level {
	case gormlogger.Silent:
		return &DbLogger{
			Logger:        dbLogger.Logger.Level(zerolog.Disabled),
			SlowThreshold: dbLogger.SlowThreshold,
		}
	case gormlogger.Error:
		return &DbLogger{
			Logger:        dbLogger.Logger.Level(zerolog.ErrorLevel),
			SlowThreshold: dbLogger.SlowThreshold,
		}
	case gormlogger.Warn:
		return &DbLogger{
			Logger:        dbLogger.Logger.Level(zerolog.WarnLevel),
			SlowThreshold: dbLogger.SlowThreshold,
		}
	case gormlogger.Info:
		return &DbLogger{
			Logger:        dbLogger.Logger.Level(zerolog.InfoLevel),
			SlowThreshold: dbLogger.SlowThreshold,
		}
	default:
		return dbLogger
	}
}

func (dbLogger *DbLogger) Info(ctx context.Context, msg string, data ...any) {
	dbLogger.Logger.Info().Msgf(msg, data...)
}

func (dbLogger *DbLogger) Warn(ctx context.Context, msg string, data ...any) {
	dbLogger.Logger.Warn().Msgf(msg, data...)
}

func (dbLogger *DbLogger) Error(ctx context.Context, msg string, data ...any) {
	dbLogger.Logger.Error().Msgf(msg, data...)
}

func (dbLogger *DbLogger) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	sql, rows := fc()
	elapsed := time.Since(begin)

	if err != nil && !errors.Is(err, gormlogger.ErrRecordNotFound) {
		dbLogger.Logger.Error().
			Err(err).
			Dur("elapsed", elapsed).
			Str("sql", sql).
			Int64("rows", rows).
			Msg("SQL query failed")
		return
	}

	// Log slow queries as warnings
	if dbLogger.SlowThreshold != 0 && elapsed >= dbLogger.SlowThreshold {
		dbLogger.Logger.Warn().
			Dur("elapsed", elapsed).
			Str("sql", sql).
			Int64("rows", rows).
			Msg("Slow SQL query")
	}
}
