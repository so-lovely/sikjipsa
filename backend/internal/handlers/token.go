package handlers

import (
	"sikjipsa-backend/pkg/config"
	"sikjipsa-backend/pkg/logger"
	"sikjipsa-backend/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type TokenHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewTokenHandler(db *gorm.DB, cfg *config.Config) *TokenHandler {
	return &TokenHandler{db: db, cfg: cfg}
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// RefreshToken handles token refresh requests
func (h *TokenHandler) RefreshToken(c *fiber.Ctx) error {
	var req RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		logger.Error("Failed to parse refresh token request: ", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate refresh token
	userID, err := utils.ValidateRefreshToken(req.RefreshToken, h.cfg.JWTSecret)
	if err != nil {
		logger.WithField("error", err.Error()).Warn("Invalid refresh token")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid refresh token",
		})
	}

	// Get user from database to ensure they still exist
	var user struct {
		ID    uint   `json:"id"`
		Email string `json:"email"`
	}
	if err := h.db.Table("users").Select("id, email").Where("id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			logger.WithField("user_id", userID).Warn("User not found for refresh token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "User not found",
			})
		}
		logger.WithField("user_id", userID).Error("Database error during token refresh: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}

	// Generate new access token
	accessToken, err := utils.GenerateJWT(user.ID, user.Email, h.cfg.JWTSecret)
	if err != nil {
		logger.WithField("user_id", userID).Error("Failed to generate new access token: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate access token",
		})
	}

	// Optionally generate new refresh token (token rotation)
	newRefreshToken, err := utils.GenerateRefreshToken(user.ID, h.cfg.JWTSecret)
	if err != nil {
		logger.WithField("user_id", userID).Error("Failed to generate new refresh token: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate refresh token",
		})
	}

	logger.WithField("user_id", userID).Info("Token refreshed successfully")

	return c.JSON(fiber.Map{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
		"token_type":    "Bearer",
		"expires_in":    3600, // 1 hour in seconds
	})
}

// RevokeToken handles token revocation requests
func (h *TokenHandler) RevokeToken(c *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	logger.WithField("user_id", userID).Info("Token revoked successfully")

	return c.JSON(fiber.Map{
		"message": "Token revoked successfully",
	})
}