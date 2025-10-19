package wallet

import (
	"github.com/google/uuid"
	"github.com/nicholascannon/wallet-api/internal/database"
	"github.com/nicholascannon/wallet-api/internal/models"
)

type repository struct{}

func newRepository() *repository {
	return &repository{}
}

// GetByID retrieves a wallet by its ID
func (r *repository) GetByID(id uuid.UUID) (*models.Wallet, error) {
	var wallet models.Wallet
	if err := database.DB.First(&wallet, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &wallet, nil
}

// UpdateWallet updates the balance of a wallet with upsert functionality
// If the wallet doesn't exist, it creates a new one with the specified ID and balance
func (r *repository) UpdateWallet(wallet *models.Wallet) error {
	return database.DB.Save(&wallet).Error
}
