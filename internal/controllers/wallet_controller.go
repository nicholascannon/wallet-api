package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/nicholascannon/wallet-api/internal/service"
)

type WalletController struct {
	walletService *service.WalletService
}

type requestBody struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

func NewWalletController(walletService *service.WalletService) *WalletController {
	return &WalletController{
		walletService: walletService,
	}
}

func (wc *WalletController) RegisterRoutes(router *gin.RouterGroup) {
	w := router.Group("/wallet")

	w.GET("/:id", wc.GetBalance)
	w.POST("/:id/credit", wc.Credit)
	w.POST("/:id/debit", wc.Debit)
}

// parseWalletID extracts and validates wallet ID from URL params
func parseWalletID(c *gin.Context) (uuid.UUID, error) {
	idStr, exists := c.Params.Get("id")
	if !exists {
		return uuid.Nil, errors.New("wallet ID is required")
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		return uuid.Nil, errors.New("invalid wallet ID format")
	}

	return id, nil
}

// handleServiceError maps service errors to appropriate HTTP responses
func handleServiceError(c *gin.Context, err error) {
	switch err {
	case service.ErrInsufficientFunds:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient funds"})
	case service.ErrOptimisticLock:
		c.JSON(http.StatusConflict, gin.H{"error": "Wallet has been modified by another process, please retry"})
	case service.ErrWalletNotFound:
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
	default:
		panic(err)
	}
}

// GetBalance retrieves wallet balance by ID
func (wc *WalletController) GetBalance(c *gin.Context) {
	id, err := parseWalletID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wallet, err := wc.walletService.GetWallet(id)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": wallet.Balance,
	})
}

// Credit adds money to a wallet
func (wc *WalletController) Credit(c *gin.Context) {
	id, err := parseWalletID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var request requestBody
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wallet, err := wc.walletService.Credit(id, request.Amount)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": wallet.Balance,
	})
}

// Debit subtracts money from a wallet
func (wc *WalletController) Debit(c *gin.Context) {
	id, err := parseWalletID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var request requestBody
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wallet, err := wc.walletService.Debit(id, request.Amount)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": wallet.Balance,
	})
}
