package wallet

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/nicholascannon/wallet-api/internal/models"
	"gorm.io/gorm"
)

// Service-level errors
var (
	ErrInsufficientFunds = errors.New("insufficient funds")
	ErrOptimisticLock    = errors.New("wallet has been modified by another process")
	ErrWalletNotFound    = errors.New("wallet not found")
)

type Service struct {
	walletRepo *Repository
}

func newService(walletRepo *Repository) *Service {
	return &Service{
		walletRepo: walletRepo,
	}
}

// isOptimisticLockError checks if the error is due to optimistic locking conflict
func isOptimisticLockError(err error) bool {
	if err == nil {
		return false
	}

	// Check if it's a unique constraint violation on our specific index
	errStr := err.Error()
	return strings.Contains(errStr, "duplicate key value violates unique constraint") &&
		strings.Contains(errStr, "idx_wallet_id_version")
}

// GetWallet retrieves wallet by ID, creating wallet if it doesn't exist
func (s *Service) GetWallet(id uuid.UUID) (*models.Wallet, error) {
	wallet, err := s.walletRepo.GetByID(id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Default wallet with zero balance if it doesn't exist
		wallet = &models.Wallet{ID: id, Balance: 0, Version: 0}
		return wallet, nil
	} else if err != nil {
		return nil, err
	}
	return wallet, nil
}

// Credit adds money to a wallet
func (s *Service) Credit(id uuid.UUID, amount float64) (*models.Wallet, error) {
	wallet, err := s.walletRepo.GetByID(id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Create wallet with zero balance if it doesn't exist
		wallet = &models.Wallet{ID: id, Balance: 0, Version: 0}
	} else if err != nil {
		return nil, err
	}

	wallet.Balance += amount
	wallet.Version++

	if err := s.walletRepo.UpdateWallet(wallet); err != nil {
		if isOptimisticLockError(err) {
			return nil, ErrOptimisticLock
		}
		return nil, err
	}

	return wallet, nil
}

// Debit subtracts money from a wallet
func (s *Service) Debit(id uuid.UUID, amount float64) (*models.Wallet, error) {
	wallet, err := s.walletRepo.GetByID(id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrWalletNotFound
	} else if err != nil {
		return nil, err
	}

	if wallet.Balance < amount {
		return nil, ErrInsufficientFunds
	}

	wallet.Balance -= amount
	wallet.Version++

	if err := s.walletRepo.UpdateWallet(wallet); err != nil {
		if isOptimisticLockError(err) {
			return nil, ErrOptimisticLock
		}
		return nil, err
	}

	return wallet, nil
}
