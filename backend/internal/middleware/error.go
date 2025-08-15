package middleware

import (
	"sikjipsa-backend/internal/errors"
	"sikjipsa-backend/pkg/logger"

	"github.com/gofiber/fiber/v2"
)

func ErrorHandler(c *fiber.Ctx, err error) error {
	// Log the error with context
	logger.WithFields(map[string]interface{}{
		"method": c.Method(),
		"path":   c.Path(),
		"ip":     c.IP(),
	}).Error("Request error: ", err)

	// Handle different types of errors
	if e, ok := err.(*fiber.Error); ok {
		// Fiber errors
		return c.Status(e.Code).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "HTTP_ERROR",
				"message": e.Message,
			},
		})
	}

	// Handle API errors
	if apiErr, ok := err.(errors.APIError); ok {
		return errors.HandleError(c, apiErr)
	}

	// Default to internal server error
	return errors.HandleError(c, errors.ErrInternal)
}