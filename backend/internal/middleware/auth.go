package middleware

import (
	"sikjipsa-backend/pkg/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func AuthRequired(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header required",
			})
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		
		claims, err := utils.ValidateToken(tokenString, secret)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token",
			})
		}

		c.Locals("userID", claims.UserID)
		c.Locals("email", claims.Email)

		return c.Next()
	}
}

func OptionalAuth(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
			
			claims, err := utils.ValidateToken(tokenString, secret)
			if err == nil {
				c.Locals("userID", claims.UserID)
				c.Locals("email", claims.Email)
			}
		}
		
		return c.Next()
	}
}