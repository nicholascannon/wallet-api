package database

import (
	"fmt"
	"time"

	"github.com/nicholascannon/wallet-api/internal/config"
	"github.com/nicholascannon/wallet-api/internal/models"
	"github.com/rs/zerolog"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Connect initializes the database connection with configuration
func Connect(cfg *config.DatabaseConfig, log zerolog.Logger) error {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode)

	log.Info().
		Str("host", cfg.Host).
		Str("port", cfg.Port).
		Str("database", cfg.Name).
		Msg("Connecting to database")

	gormLogger := NewGormLogger(log, 200*time.Millisecond) // Log queries slower than 200ms

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	log.Info().
		Int("max_open_conns", cfg.MaxOpenConns).
		Int("max_idle_conns", cfg.MaxIdleConns).
		Dur("conn_max_lifetime", cfg.ConnMaxLifetime).
		Msg("Database connection pool configured")

	if err := DB.AutoMigrate(&models.Wallet{}); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Info().Msg("Database connected and migrated successfully")
	return nil
}

// Close closes the database connection
func Close() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	return sqlDB.Close()
}
