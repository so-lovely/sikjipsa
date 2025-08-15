package utils

import (
	"sikjipsa-backend/pkg/utils"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestGenerateJWT(t *testing.T) {
	userID := uint(123)
	email := "test@example.com"
	secret := "test-secret-key"
	
	token, err := utils.GenerateJWT(userID, email, secret)
	
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
	assert.IsType(t, "", token)
}

func TestJWTBasicFunctionality(t *testing.T) {
	userID := uint(456)
	email := "test@example.com"
	secret := "test-secret-key"
	
	// Generate a token
	token, err := utils.GenerateJWT(userID, email, secret)
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
	
	// Token should contain JWT format (3 parts separated by dots)
	parts := len(strings.Split(token, "."))
	assert.Equal(t, 3, parts)
}

func TestJWTWithDifferentSecrets(t *testing.T) {
	userID := uint(789)
	email := "test@example.com"
	secret1 := "secret-one"
	secret2 := "secret-two"
	
	// Generate tokens with different secrets
	token1, err := utils.GenerateJWT(userID, email, secret1)
	assert.NoError(t, err)
	
	token2, err := utils.GenerateJWT(userID, email, secret2)
	assert.NoError(t, err)
	
	// Tokens should be different
	assert.NotEqual(t, token1, token2)
}

func TestJWTEmptyInputs(t *testing.T) {
	// Test with empty secret
	token, err := utils.GenerateJWT(123, "test@example.com", "")
	assert.NoError(t, err) // JWT library allows empty secret
	assert.NotEmpty(t, token)
	
	// Test with empty email
	token, err = utils.GenerateJWT(123, "", "secret")
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestJWTConsistency(t *testing.T) {
	userID := uint(999)
	email := "consistent@example.com"
	secret := "consistent-secret"
	
	// Generate same token twice with 1 second gap
	token1, err := utils.GenerateJWT(userID, email, secret)
	assert.NoError(t, err)
	
	// Wait enough to ensure timestamp difference in exp claim
	time.Sleep(time.Second)
	
	token2, err := utils.GenerateJWT(userID, email, secret)
	assert.NoError(t, err)
	
	// Tokens should be different due to timestamp in exp claim
	assert.NotEqual(t, token1, token2)
}