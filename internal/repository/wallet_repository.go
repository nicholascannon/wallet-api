package repository

import (
	"github.com/google/uuid"
	"github.com/nicholascannon/wallet-api/internal/database"
	"github.com/nicholascannon/wallet-api/internal/models"
)

type WalletRepository struct{}

func NewWalletRepository() *WalletRepository {
	return &WalletRepository{}
}

// GetByID retrieves a wallet by its ID
func (r *WalletRepository) GetByID(id uuid.UUID) (*models.Wallet, error) {
	var wallet models.Wallet
	if err := database.DB.First(&wallet, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &wallet, nil
}

// UpdateWallet updates the balance of a wallet with upsert functionality
// If the wallet doesn't exist, it creates a new one with the specified ID and balance
func (r *WalletRepository) UpdateWallet(wallet *models.Wallet) error {
	return database.DB.Save(&wallet).Error
}
