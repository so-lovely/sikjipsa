package errors

import (
	"errors"
	"net/http/httptest"
	apiErrors "sikjipsa-backend/internal/errors"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestAPIError_Error(t *testing.T) {
	err := apiErrors.APIError{
		Code:    "TEST_ERROR",
		Message: "Test error message",
		Status:  400,
	}

	assert.Equal(t, "Test error message", err.Error())
}

func TestNewAPIError(t *testing.T) {
	err := apiErrors.NewAPIError("CUSTOM_ERROR", "Custom message", 422)
	
	assert.Equal(t, "CUSTOM_ERROR", err.Code)
	assert.Equal(t, "Custom message", err.Message)
	assert.Equal(t, 422, err.Status)
}

func TestNewValidationError(t *testing.T) {
	err := apiErrors.NewValidationError("Field 'name' is required")
	
	assert.Equal(t, apiErrors.ErrCodeValidationFailed, err.Code)
	assert.Equal(t, "Request validation failed", err.Message)
	assert.Equal(t, "Field 'name' is required", err.Details)
	assert.Equal(t, 400, err.Status)
}

func TestNewNotFoundError(t *testing.T) {
	err := apiErrors.NewNotFoundError("User")
	
	assert.Equal(t, apiErrors.ErrCodeNotFound, err.Code)
	assert.Equal(t, "User not found", err.Message)
	assert.Equal(t, 404, err.Status)
}

func TestNewConflictError(t *testing.T) {
	err := apiErrors.NewConflictError("Email already exists")
	
	assert.Equal(t, apiErrors.ErrCodeConflict, err.Code)
	assert.Equal(t, "Email already exists", err.Message)
	assert.Equal(t, 409, err.Status)
}

func TestHandleError_APIError(t *testing.T) {
	app := fiber.New()
	app.Get("/test", func(c *fiber.Ctx) error {
		return apiErrors.HandleError(c, apiErrors.ErrValidationFailed)
	})

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)
}

func TestHandleError_GenericError(t *testing.T) {
	app := fiber.New()
	app.Get("/test", func(c *fiber.Ctx) error {
		return apiErrors.HandleError(c, errors.New("generic error"))
	})

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	assert.Equal(t, 500, resp.StatusCode)
}

func TestPredefinedErrors(t *testing.T) {
	testCases := []struct {
		name     string
		err      apiErrors.APIError
		code     string
		status   int
	}{
		{
			name:   "Unauthorized",
			err:    apiErrors.ErrUnauthorized,
			code:   apiErrors.ErrCodeUnauthorized,
			status: 401,
		},
		{
			name:   "Invalid Token",
			err:    apiErrors.ErrInvalidToken,
			code:   apiErrors.ErrCodeInvalidToken,
			status: 401,
		},
		{
			name:   "Token Expired",
			err:    apiErrors.ErrTokenExpired,
			code:   apiErrors.ErrCodeTokenExpired,
			status: 401,
		},
		{
			name:   "Validation Failed",
			err:    apiErrors.ErrValidationFailed,
			code:   apiErrors.ErrCodeValidationFailed,
			status: 400,
		},
		{
			name:   "Not Found",
			err:    apiErrors.ErrNotFound,
			code:   apiErrors.ErrCodeNotFound,
			status: 404,
		},
		{
			name:   "Forbidden",
			err:    apiErrors.ErrForbidden,
			code:   apiErrors.ErrCodeForbidden,
			status: 403,
		},
		{
			name:   "Rate Limited",
			err:    apiErrors.ErrRateLimited,
			code:   apiErrors.ErrCodeRateLimited,
			status: 429,
		},
		{
			name:   "Internal Error",
			err:    apiErrors.ErrInternal,
			code:   apiErrors.ErrCodeInternal,
			status: 500,
		},
		{
			name:   "Database Error",
			err:    apiErrors.ErrDatabaseError,
			code:   apiErrors.ErrCodeDatabaseError,
			status: 500,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.code, tc.err.Code)
			assert.Equal(t, tc.status, tc.err.Status)
			assert.NotEmpty(t, tc.err.Message)
		})
	}
}

func TestErrorCodes(t *testing.T) {
	// Test that all error codes are properly defined
	codes := []string{
		apiErrors.ErrCodeUnauthorized,
		apiErrors.ErrCodeInvalidToken,
		apiErrors.ErrCodeTokenExpired,
		apiErrors.ErrCodeInvalidCredentials,
		apiErrors.ErrCodeValidationFailed,
		apiErrors.ErrCodeInvalidInput,
		apiErrors.ErrCodeMissingField,
		apiErrors.ErrCodeNotFound,
		apiErrors.ErrCodeAlreadyExists,
		apiErrors.ErrCodeConflict,
		apiErrors.ErrCodeForbidden,
		apiErrors.ErrCodeInsufficientPermissions,
		apiErrors.ErrCodeRateLimited,
		apiErrors.ErrCodeInternal,
		apiErrors.ErrCodeDatabaseError,
		apiErrors.ErrCodeExternalAPI,
		apiErrors.ErrCodeServiceUnavailable,
	}

	for _, code := range codes {
		assert.NotEmpty(t, code, "Error code should not be empty")
	}
}