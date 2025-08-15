package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

// SetupRateLimit creates and configures rate limiting middleware
func SetupRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        100,             // Maximum number of requests
		Expiration: 1 * time.Minute, // Time window
		KeyGenerator: func(c *fiber.Ctx) string {
			// Use IP address as key for rate limiting
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error":   "Rate limit exceeded",
				"message": "Too many requests. Please try again later.",
			})
		},
		SkipFailedRequests:     false, // Count failed requests
		SkipSuccessfulRequests: false, // Count successful requests
	})
}

// SetupAuthRateLimit creates stricter rate limiting for authentication endpoints
func SetupAuthRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        10,               // Maximum 10 auth attempts
		Expiration: 15 * time.Minute, // 15 minute window
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error":   "Authentication rate limit exceeded",
				"message": "Too many authentication attempts. Please try again in 15 minutes.",
			})
		},
		SkipFailedRequests:     false,
		SkipSuccessfulRequests: true, // Don't count successful auth attempts
	})
}

// SetupUploadRateLimit creates rate limiting for file upload endpoints
func SetupUploadRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        20,              // Maximum 20 uploads
		Expiration: 1 * time.Hour,   // 1 hour window
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error":   "Upload rate limit exceeded",
				"message": "Too many file uploads. Please try again later.",
			})
		},
		SkipFailedRequests:     false,
		SkipSuccessfulRequests: false,
	})
}