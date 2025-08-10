package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
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
		
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token",
			})
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			c.Locals("userID", claims["user_id"])
			c.Locals("email", claims["email"])
		}

		return c.Next()
	}
}

func OptionalAuth(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
			
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			})

			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					c.Locals("userID", claims["user_id"])
					c.Locals("email", claims["email"])
				}
			}
		}
		
		return c.Next()
	}
}