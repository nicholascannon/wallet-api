package wallet

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	walletService *Service
}

type requestBody struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

func newHandler(walletService *Service) *Handler {
	return &Handler{
		walletService: walletService,
	}
}

func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	w := router.Group("/wallet")

	w.GET("/:id", h.GetBalance)
	w.POST("/:id/credit", h.Credit)
	w.POST("/:id/debit", h.Debit)
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
	case ErrInsufficientFunds:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient funds"})
	case ErrOptimisticLock:
		c.JSON(http.StatusConflict, gin.H{"error": "Wallet has been modified by another process, please retry"})
	case ErrWalletNotFound:
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
	default:
		panic(err)
	}
}

// GetBalance retrieves wallet balance by ID
func (h *Handler) GetBalance(c *gin.Context) {
	id, err := parseWalletID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wallet, err := h.walletService.GetWallet(id)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": wallet.Balance,
	})
}

// Credit adds money to a wallet
func (h *Handler) Credit(c *gin.Context) {
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

	wallet, err := h.walletService.Credit(id, request.Amount)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": wallet.Balance,
	})
}

// Debit subtracts money from a wallet
func (h *Handler) Debit(c *gin.Context) {
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

	wallet, err := h.walletService.Debit(id, request.Amount)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": wallet.Balance,
	})
}
