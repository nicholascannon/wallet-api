package controllers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type WalletController struct{}

func NewWalletController() *WalletController {
	return &WalletController{}
}

func (wc *WalletController) RegisterRoutes(router *gin.RouterGroup) {
	w := router.Group("/wallet")

	w.GET("/:id", wc.GetBalance)
	w.POST("/:id/credit", wc.Credit)
	w.POST("/:id/debit", wc.Debit)
}

func (wc *WalletController) GetBalance(c *gin.Context) {
	id, _ := c.Params.Get("id")
	fmt.Printf("Wallet ID = %v\n", id)

	c.JSON(http.StatusOK, gin.H{
		"balance": 1000.00,
	})
}

func (wc *WalletController) Credit(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"balance": 1100.00,
	})
}

func (wc *WalletController) Debit(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"balance": 1050.00,
	})
}
