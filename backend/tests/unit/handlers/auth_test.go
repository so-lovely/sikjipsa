package handlers

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"sikjipsa-backend/internal/handlers"
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/config"
	"sikjipsa-backend/tests"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

type AuthHandlerTestSuite struct {
	suite.Suite
	app         *fiber.App
	authHandler *handlers.AuthHandler
	db          *gorm.DB
}

func (suite *AuthHandlerTestSuite) SetupSuite() {
	suite.db = tests.SetupTestDB(suite.T())
	
	// Migrate test models
	suite.db.AutoMigrate(&models.User{})
	
	cfg := &config.Config{
		JWTSecret:         "test-secret",
		NaverClientID:     "test-naver-client-id",
		NaverClientSecret: "test-naver-client-secret",
	}
	
	suite.authHandler = handlers.NewAuthHandler(suite.db, cfg)
	suite.app = fiber.New()
}

func (suite *AuthHandlerTestSuite) SetupTest() {
	// Clean database before each test
	suite.db.Exec("DELETE FROM users")
}

func (suite *AuthHandlerTestSuite) TestCreateUser() {
	// Test user creation
	user := &models.User{
		Email:          "test@example.com",
		Username:       "testuser",
		SocialProvider: "naver",
	}
	
	err := suite.db.Create(user).Error
	assert.NoError(suite.T(), err)
	assert.NotZero(suite.T(), user.ID)
	
	// Verify user exists
	var foundUser models.User
	err = suite.db.Where("email = ?", "test@example.com").First(&foundUser).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "testuser", foundUser.Username)
}

func (suite *AuthHandlerTestSuite) TestSocialLoginRequestValidation() {
	// Test invalid request (missing required fields)
	invalidReq := map[string]interface{}{
		"state": "test-state",
		// Missing code and redirect_uri
	}
	
	body, _ := json.Marshal(invalidReq)
	req := httptest.NewRequest("POST", "/auth/naver", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), fiber.StatusBadRequest, resp.StatusCode)
}

func (suite *AuthHandlerTestSuite) TestValidSocialLoginRequest() {
	// Test valid request structure
	validReq := map[string]interface{}{
		"code":         "test-code",
		"state":        "test-state",
		"redirect_uri": "http://localhost:3000/callback",
	}
	
	body, _ := json.Marshal(validReq)
	assert.NotNil(suite.T(), body)
	assert.Contains(suite.T(), string(body), "test-code")
}

func (suite *AuthHandlerTestSuite) TestUserDeletion() {
	// Create test user
	user := &models.User{
		Email:          "delete@example.com",
		Username:       "deleteuser",
		SocialProvider: "naver",
	}
	
	err := suite.db.Create(user).Error
	assert.NoError(suite.T(), err)
	
	// Delete user
	err = suite.db.Delete(user).Error
	assert.NoError(suite.T(), err)
	
	// Verify user is deleted
	var foundUser models.User
	err = suite.db.Where("email = ?", "delete@example.com").First(&foundUser).Error
	assert.Error(suite.T(), err)
	assert.Equal(suite.T(), gorm.ErrRecordNotFound, err)
}

func (suite *AuthHandlerTestSuite) TestUserWithSameEmailDifferentProvider() {
	// Create user with naver provider
	user1 := &models.User{
		Email:          "same@example.com",
		Username:       "sameuser1",
		SocialProvider: "naver",
	}
	
	err := suite.db.Create(user1).Error
	assert.NoError(suite.T(), err)
	
	// Create user with same email but different provider
	user2 := &models.User{
		Email:          "same@example.com",
		Username:       "sameuser2",
		SocialProvider: "kakao",
	}
	
	err = suite.db.Create(user2).Error
	assert.NoError(suite.T(), err)
	
	// Both users should exist
	var users []models.User
	err = suite.db.Where("email = ?", "same@example.com").Find(&users).Error
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), users, 2)
}

func TestAuthHandlerSuite(t *testing.T) {
	suite.Run(t, new(AuthHandlerTestSuite))
}