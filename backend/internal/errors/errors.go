package errors

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
)

// APIError represents a standardized API error
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
	Status  int    `json:"-"`
}

// Error implements the error interface
func (e APIError) Error() string {
	return e.Message
}

// Common error codes
const (
	// Authentication errors
	ErrCodeUnauthorized       = "UNAUTHORIZED"
	ErrCodeInvalidToken       = "INVALID_TOKEN"
	ErrCodeTokenExpired       = "TOKEN_EXPIRED"
	ErrCodeInvalidCredentials = "INVALID_CREDENTIALS"

	// Validation errors
	ErrCodeValidationFailed = "VALIDATION_FAILED"
	ErrCodeInvalidInput     = "INVALID_INPUT"
	ErrCodeMissingField     = "MISSING_FIELD"

	// Resource errors
	ErrCodeNotFound      = "NOT_FOUND"
	ErrCodeAlreadyExists = "ALREADY_EXISTS"
	ErrCodeConflict      = "CONFLICT"

	// Permission errors
	ErrCodeForbidden      = "FORBIDDEN"
	ErrCodeInsufficientPermissions = "INSUFFICIENT_PERMISSIONS"

	// Rate limiting errors
	ErrCodeRateLimited = "RATE_LIMITED"

	// Server errors
	ErrCodeInternal       = "INTERNAL_ERROR"
	ErrCodeDatabaseError  = "DATABASE_ERROR"
	ErrCodeExternalAPI    = "EXTERNAL_API_ERROR"
	ErrCodeServiceUnavailable = "SERVICE_UNAVAILABLE"
)

// Predefined errors
var (
	ErrUnauthorized = APIError{
		Code:    ErrCodeUnauthorized,
		Message: "Authentication required",
		Status:  http.StatusUnauthorized,
	}

	ErrInvalidToken = APIError{
		Code:    ErrCodeInvalidToken,
		Message: "Invalid or malformed token",
		Status:  http.StatusUnauthorized,
	}

	ErrTokenExpired = APIError{
		Code:    ErrCodeTokenExpired,
		Message: "Token has expired",
		Status:  http.StatusUnauthorized,
	}

	ErrValidationFailed = APIError{
		Code:    ErrCodeValidationFailed,
		Message: "Request validation failed",
		Status:  http.StatusBadRequest,
	}

	ErrNotFound = APIError{
		Code:    ErrCodeNotFound,
		Message: "Resource not found",
		Status:  http.StatusNotFound,
	}

	ErrForbidden = APIError{
		Code:    ErrCodeForbidden,
		Message: "Access denied",
		Status:  http.StatusForbidden,
	}

	ErrRateLimited = APIError{
		Code:    ErrCodeRateLimited,
		Message: "Too many requests",
		Status:  http.StatusTooManyRequests,
	}

	ErrInternal = APIError{
		Code:    ErrCodeInternal,
		Message: "Internal server error",
		Status:  http.StatusInternalServerError,
	}

	ErrDatabaseError = APIError{
		Code:    ErrCodeDatabaseError,
		Message: "Database operation failed",
		Status:  http.StatusInternalServerError,
	}
)

// NewAPIError creates a new API error
func NewAPIError(code, message string, status int) APIError {
	return APIError{
		Code:    code,
		Message: message,
		Status:  status,
	}
}

// NewValidationError creates a validation error with details
func NewValidationError(details string) APIError {
	return APIError{
		Code:    ErrCodeValidationFailed,
		Message: "Request validation failed",
		Details: details,
		Status:  http.StatusBadRequest,
	}
}

// NewNotFoundError creates a not found error for a specific resource
func NewNotFoundError(resource string) APIError {
	return APIError{
		Code:    ErrCodeNotFound,
		Message: resource + " not found",
		Status:  http.StatusNotFound,
	}
}

// NewConflictError creates a conflict error
func NewConflictError(message string) APIError {
	return APIError{
		Code:    ErrCodeConflict,
		Message: message,
		Status:  http.StatusConflict,
	}
}

// HandleError sends an error response
func HandleError(c *fiber.Ctx, err error) error {
	var apiErr APIError

	switch e := err.(type) {
	case APIError:
		apiErr = e
	default:
		// Default to internal server error
		apiErr = ErrInternal
		apiErr.Details = err.Error()
	}

	return c.Status(apiErr.Status).JSON(fiber.Map{
		"error": fiber.Map{
			"code":    apiErr.Code,
			"message": apiErr.Message,
			"details": apiErr.Details,
		},
	})
}

// HandleErrorWithLog sends an error response and logs it
func HandleErrorWithLog(c *fiber.Ctx, err error, logFunc func(string, ...interface{})) error {
	var apiErr APIError

	switch e := err.(type) {
	case APIError:
		apiErr = e
	default:
		apiErr = ErrInternal
		apiErr.Details = err.Error()
	}

	// Log the error
	if logFunc != nil {
		logFunc("API Error: %s - %s", apiErr.Code, apiErr.Message)
	}

	return c.Status(apiErr.Status).JSON(fiber.Map{
		"error": fiber.Map{
			"code":    apiErr.Code,
			"message": apiErr.Message,
			"details": apiErr.Details,
		},
	})
}