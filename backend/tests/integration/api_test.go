package integration

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"sikjipsa-backend/internal/handlers"
	"sikjipsa-backend/internal/middleware"
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/config"
	"sikjipsa-backend/tests"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

type APITestSuite struct {
	suite.Suite
	app *fiber.App
	db  *gorm.DB
	cfg *config.Config
}

func (suite *APITestSuite) SetupSuite() {
	suite.db = tests.SetupTestDB(suite.T())
	
	// Setup test config
	suite.cfg = &config.Config{
		JWTSecret:      "test-jwt-secret",
		AllowedOrigins: "http://localhost:3000,http://localhost:3001",
	}
	
	// Setup Fiber app with middleware
	suite.app = fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})
	
	// Add CORS middleware
	suite.app.Use(cors.New(cors.Config{
		AllowOrigins:     suite.cfg.AllowedOrigins,
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))
	
	// Setup routes
	api := suite.app.Group("/api/v1")
	handlers.SetupRoutes(api, suite.db, suite.cfg)
	
	// Migrate models
	suite.db.AutoMigrate(
		&models.User{},
		&models.Plant{},
		&models.Diary{},
		&models.Community{},
		&models.Announcement{},
		&models.Diagnosis{},
	)
}

func (suite *APITestSuite) SetupTest() {
	// Clean database before each test
	suite.db.Exec("DELETE FROM diagnoses")
	suite.db.Exec("DELETE FROM announcements") 
	suite.db.Exec("DELETE FROM communities")
	suite.db.Exec("DELETE FROM diaries")
	suite.db.Exec("DELETE FROM plants")
	suite.db.Exec("DELETE FROM users")
}

func (suite *APITestSuite) TestHealthCheck() {
	req := httptest.NewRequest("GET", "/api/v1/health", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusOK, resp.StatusCode)
}

func (suite *APITestSuite) TestCORSHeaders() {
	req := httptest.NewRequest("OPTIONS", "/api/v1/health", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusNoContent, resp.StatusCode)
	assert.Equal(suite.T(), "http://localhost:3000", resp.Header.Get("Access-Control-Allow-Origin"))
}

func (suite *APITestSuite) TestUnauthorizedAccess() {
	// Test accessing protected endpoint without token
	req := httptest.NewRequest("GET", "/api/v1/plants", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusUnauthorized, resp.StatusCode)
}

func (suite *APITestSuite) TestInvalidJSONRequest() {
	invalidJSON := `{"invalid": json}`
	req := httptest.NewRequest("POST", "/api/v1/auth/naver", bytes.NewReader([]byte(invalidJSON)))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusBadRequest, resp.StatusCode)
}

func (suite *APITestSuite) TestLargeRequestBody() {
	// Test request larger than body limit (25MB)
	largeData := make([]byte, 26*1024*1024) // 26MB
	req := httptest.NewRequest("POST", "/api/v1/auth/naver", bytes.NewReader(largeData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusRequestEntityTooLarge, resp.StatusCode)
}

func (suite *APITestSuite) TestContentTypeValidation() {
	validReq := map[string]interface{}{
		"code":         "test-code",
		"redirect_uri": "http://localhost:3000/callback",
	}
	
	body, _ := json.Marshal(validReq)
	
	// Test without Content-Type header
	req := httptest.NewRequest("POST", "/api/v1/auth/naver", bytes.NewReader(body))
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	// Should still work as Fiber is lenient with content-type
	assert.True(suite.T(), resp.StatusCode >= 400)
}

func (suite *APITestSuite) TestNonExistentEndpoint() {
	req := httptest.NewRequest("GET", "/api/v1/nonexistent", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusNotFound, resp.StatusCode)
}

func TestAPITestSuite(t *testing.T) {
	suite.Run(t, new(APITestSuite))
}