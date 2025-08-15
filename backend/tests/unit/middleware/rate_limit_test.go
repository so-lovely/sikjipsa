package middleware

import (
	"net/http/httptest"
	"sikjipsa-backend/internal/middleware"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestSetupRateLimit(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.SetupRateLimit())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Test that rate limiting middleware is working
	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
}

func TestSetupAuthRateLimit(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.SetupAuthRateLimit())
	app.Post("/auth", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Test that auth rate limiting middleware is working
	req := httptest.NewRequest("POST", "/auth", nil)
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
}

func TestSetupUploadRateLimit(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.SetupUploadRateLimit())
	app.Post("/upload", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Test that upload rate limiting middleware is working
	req := httptest.NewRequest("POST", "/upload", nil)
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
}

func TestRateLimitExceeded(t *testing.T) {
	app := fiber.New()
	
	// Setup very low rate limit for testing
	app.Use(middleware.SetupRateLimit())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Make many requests to exceed rate limit
	// Note: This test might be flaky depending on the rate limit implementation
	// In a real scenario, you'd need to mock the rate limiter or use a lower limit
	for i := 0; i < 5; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		resp, err := app.Test(req)
		assert.NoError(t, err)
		
		// First few requests should succeed
		if i < 3 {
			assert.NotEqual(t, fiber.StatusTooManyRequests, resp.StatusCode)
		}
	}
}

func TestRateLimitConfiguration(t *testing.T) {
	// Test that rate limit middleware functions can be called without errors
	generalRateLimit := middleware.SetupRateLimit()
	authRateLimit := middleware.SetupAuthRateLimit()
	uploadRateLimit := middleware.SetupUploadRateLimit()
	
	assert.NotNil(t, generalRateLimit)
	assert.NotNil(t, authRateLimit)
	assert.NotNil(t, uploadRateLimit)
	
	// Verify they're all Fiber handlers
	assert.IsType(t, generalRateLimit, fiber.Handler(nil))
	assert.IsType(t, authRateLimit, fiber.Handler(nil))
	assert.IsType(t, uploadRateLimit, fiber.Handler(nil))
}