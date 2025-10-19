package controllers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/nicholascannon/wallet-api/internal/models"
	"github.com/nicholascannon/wallet-api/internal/repository"
	"gorm.io/gorm"
)

type WalletController struct {
	walletRepo *repository.WalletRepository
}

type requestBody struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
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

func NewWalletController() *WalletController {
	return &WalletController{
		walletRepo: repository.NewWalletRepository(),
	}
}

func (wc *WalletController) RegisterRoutes(router *gin.RouterGroup) {
	w := router.Group("/wallet")

	w.GET("/:id", wc.GetBalance)
	w.POST("/:id/credit", wc.Credit)
	w.POST("/:id/debit", wc.Debit)
}

// GetBalance retrieves wallet balance by ID
func (wc *WalletController) GetBalance(c *gin.Context) {
	idStr, exists := c.Params.Get("id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet ID is required"})
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid wallet ID format"})
		return
	}

	wallet, err := wc.walletRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			wallet = &models.Wallet{ID: id, Balance: 0, Version: 0}
		} else {
			panic(err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": wallet.Balance,
	})
}

// Credit adds money to a wallet
func (wc *WalletController) Credit(c *gin.Context) {
	idStr, exists := c.Params.Get("id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet ID is required"})
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid wallet ID format"})
		return
	}

	var request requestBody
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wallet, err := wc.walletRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			wallet = &models.Wallet{ID: id, Balance: 0, Version: 0}
		} else {
			panic(err)
		}
	}

	wallet.Balance += request.Amount
	wallet.Version++

	if err := wc.walletRepo.UpdateWallet(wallet); err != nil {
		if isOptimisticLockError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Wallet has been modified by another process, please retry"})
			return
		} else {
			panic(err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": wallet.Balance,
	})
}

// Debit subtracts money from a wallet
func (wc *WalletController) Debit(c *gin.Context) {
	idStr, exists := c.Params.Get("id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet ID is required"})
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid wallet ID format"})
		return
	}

	var request requestBody
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wallet, err := wc.walletRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
			return
		} else {
			panic(err)
		}
	}

	if wallet.Balance < request.Amount {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient funds"})
		return
	}

	wallet.Balance -= request.Amount
	wallet.Version++

	if err := wc.walletRepo.UpdateWallet(wallet); err != nil {
		if isOptimisticLockError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Wallet has been modified by another process, please retry"})
			return
		} else {
			panic(err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": wallet.Balance,
	})
}
