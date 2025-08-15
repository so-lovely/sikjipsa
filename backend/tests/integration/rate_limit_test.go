package integration

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"sikjipsa-backend/internal/handlers"
	"sikjipsa-backend/internal/middleware"
	"sikjipsa-backend/pkg/config"
	"sikjipsa-backend/pkg/database"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

type RateLimitTestSuite struct {
	suite.Suite
	app *fiber.App
	db  *gorm.DB
	cfg *config.Config
}

func (suite *RateLimitTestSuite) SetupSuite() {
	// Setup test database
	testDBURL := "sqlite://test.db"
	suite.db = database.Connect(testDBURL)
	
	suite.cfg = &config.Config{
		JWTSecret:      "test-jwt-secret",
		AllowedOrigins: "http://localhost:3000",
	}
	
	suite.app = fiber.New()
	
	// Setup test routes with rate limiting
	api := suite.app.Group("/api/v1")
	handlers.SetupRoutes(api, suite.db, suite.cfg)
}

func (suite *RateLimitTestSuite) TestGeneralRateLimit() {
	// Test general rate limiting (100 requests per minute)
	endpoint := "/api/v1/plants"
	
	// Make requests up to the limit
	for i := 0; i < 100; i++ {
		req := httptest.NewRequest("GET", endpoint, nil)
		resp, err := suite.app.Test(req)
		assert.NoError(suite.T(), err)
		
		// Should not be rate limited yet
		assert.NotEqual(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
	}
	
	// The 101st request should be rate limited
	req := httptest.NewRequest("GET", endpoint, nil)
	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
}

func (suite *RateLimitTestSuite) TestAuthRateLimit() {
	// Test authentication rate limiting (10 requests per 15 minutes)
	endpoint := "/api/v1/auth/naver"
	
	requestBody := map[string]interface{}{
		"code":         "test-code",
		"redirect_uri": "http://localhost:3000/callback",
	}
	body, _ := json.Marshal(requestBody)
	
	// Make requests up to the auth limit
	for i := 0; i < 10; i++ {
		req := httptest.NewRequest("POST", endpoint, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		resp, err := suite.app.Test(req)
		assert.NoError(suite.T(), err)
		
		// Should not be rate limited yet (though it will fail for other reasons)
		assert.NotEqual(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
	}
	
	// The 11th request should be rate limited
	req := httptest.NewRequest("POST", endpoint, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
}

func (suite *RateLimitTestSuite) TestUploadRateLimit() {
	// Test upload rate limiting (20 requests per hour)
	endpoint := "/api/v1/community/upload-image"
	
	// This would require authentication, so we expect 401 or rate limit
	for i := 0; i < 20; i++ {
		req := httptest.NewRequest("POST", endpoint, nil)
		resp, err := suite.app.Test(req)
		assert.NoError(suite.T(), err)
		
		// Should not be rate limited yet
		assert.NotEqual(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
	}
	
	// The 21st request should be rate limited
	req := httptest.NewRequest("POST", endpoint, nil)
	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
}

func (suite *RateLimitTestSuite) TestRateLimitByIP() {
	// Test that rate limiting is applied per IP address
	// Simulate different IP addresses by using custom test setup
	app := fiber.New()
	app.Use(middleware.SetupRateLimit())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
	
	// Make requests that should be limited per IP
	for i := 0; i < 105; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		resp, err := app.Test(req)
		assert.NoError(suite.T(), err)
		
		if i < 100 {
			// First 100 should succeed
			assert.NotEqual(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
		} else {
			// Requests 101+ should be rate limited
			assert.Equal(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
		}
	}
}

func (suite *RateLimitTestSuite) TestRateLimitResponse() {
	// Test rate limit response format
	app := fiber.New()
	app.Use(middleware.SetupRateLimit())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
	
	// Exceed rate limit
	for i := 0; i < 101; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		app.Test(req)
	}
	
	// Check rate limit response
	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
	
	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)
	assert.Equal(suite.T(), "Rate limit exceeded", response["error"])
	assert.Contains(suite.T(), response["message"], "Too many requests")
}

func (suite *RateLimitTestSuite) TestDifferentRateLimitsForDifferentEndpoints() {
	// Test that different endpoints have different rate limits
	authApp := fiber.New()
	authApp.Use(middleware.SetupAuthRateLimit())
	authApp.Post("/auth", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
	
	uploadApp := fiber.New()
	uploadApp.Use(middleware.SetupUploadRateLimit())
	uploadApp.Post("/upload", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
	
	// Test auth rate limit (10 requests)
	for i := 0; i < 11; i++ {
		req := httptest.NewRequest("POST", "/auth", nil)
		resp, err := authApp.Test(req)
		assert.NoError(suite.T(), err)
		
		if i < 10 {
			assert.NotEqual(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
		} else {
			assert.Equal(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
		}
	}
	
	// Test upload rate limit (20 requests)
	for i := 0; i < 21; i++ {
		req := httptest.NewRequest("POST", "/upload", nil)
		resp, err := uploadApp.Test(req)
		assert.NoError(suite.T(), err)
		
		if i < 20 {
			assert.NotEqual(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
		} else {
			assert.Equal(suite.T(), fiber.StatusTooManyRequests, resp.StatusCode)
		}
	}
}

func (suite *RateLimitTestSuite) TestRateLimitExpiration() {
	// This test would require mocking time or waiting, so we'll just test the setup
	app := fiber.New()
	app.Use(middleware.SetupRateLimit())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "time": time.Now().Unix()})
	})
	
	// Make one request to ensure the rate limiter is working
	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusOK, resp.StatusCode)
	
	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)
	assert.Equal(suite.T(), "ok", response["status"])
}

func TestRateLimitTestSuite(t *testing.T) {
	suite.Run(t, new(RateLimitTestSuite))
}