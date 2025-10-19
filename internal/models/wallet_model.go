package models

import (
	"time"

	"github.com/google/uuid"
)

type Wallet struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid();uniqueIndex:idx_wallet_id_version,composite:id,version"`
	Balance   float64   `json:"balance" gorm:"not null;default:0"`
	Version   int       `json:"version" gorm:"not null;default:0;uniqueIndex:idx_wallet_id_version,composite:id,version"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime;not null"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime;not null"`
}
