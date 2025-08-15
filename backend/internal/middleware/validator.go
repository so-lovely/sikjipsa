package middleware

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
	
	// Register custom validation functions
	validate.RegisterValidation("noempty", validateNotEmpty)
	validate.RegisterValidation("alphanumeric", validateAlphanumeric)
	validate.RegisterValidation("strongpassword", validateStrongPassword)
}

// ValidateRequest validates request body against struct tags
func ValidateRequest(targetType interface{}) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Create new instance of the target type
		target := reflect.New(reflect.TypeOf(targetType).Elem()).Interface()
		
		// Parse request body into target struct
		if err := c.BodyParser(target); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "Invalid request body",
				"message": "Request body must be valid JSON",
			})
		}

		// Validate the parsed struct
		if err := validate.Struct(target); err != nil {
			var validationErrors []string
			
			for _, err := range err.(validator.ValidationErrors) {
				validationErrors = append(validationErrors, formatValidationError(err))
			}
			
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "Validation failed",
				"message": "Request validation failed",
				"details": validationErrors,
			})
		}

		// Store validated data in context
		c.Locals("validated", target)
		return c.Next()
	}
}

// ValidateJSON validates JSON request body
func ValidateJSON() fiber.Handler {
	return func(c *fiber.Ctx) error {
		contentType := c.Get("Content-Type")
		if !strings.Contains(contentType, "application/json") {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "Invalid content type",
				"message": "Content-Type must be application/json",
			})
		}

		// Check if body is empty
		body := c.Body()
		if len(body) == 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "Empty request body",
				"message": "Request body cannot be empty",
			})
		}

		// Check for basic JSON structure
		bodyStr := string(body)
		if !strings.HasPrefix(bodyStr, "{") || !strings.HasSuffix(bodyStr, "}") {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "Invalid JSON format",
				"message": "Request body must be valid JSON object",
			})
		}

		return c.Next()
	}
}

// SanitizeInput removes potentially dangerous characters
func SanitizeInput() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Sanitize query parameters
		queries := c.Queries()
		for key, value := range queries {
			sanitized := sanitizeString(value)
			c.Request().URI().QueryArgs().Set(key, sanitized)
		}

		return c.Next()
	}
}

// Custom validation functions
func validateNotEmpty(fl validator.FieldLevel) bool {
	value := strings.TrimSpace(fl.Field().String())
	return len(value) > 0
}

func validateAlphanumeric(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	for _, char := range value {
		if !((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9')) {
			return false
		}
	}
	return true
}

func validateStrongPassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()
	if len(password) < 8 {
		return false
	}
	
	hasUpper := false
	hasLower := false
	hasDigit := false
	hasSpecial := false
	
	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasDigit = true
		default:
			hasSpecial = true
		}
	}
	
	return hasUpper && hasLower && hasDigit && hasSpecial
}

// Format validation error messages
func formatValidationError(err validator.FieldError) string {
	field := err.Field()
	tag := err.Tag()
	
	switch tag {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "email":
		return fmt.Sprintf("%s must be a valid email address", field)
	case "min":
		return fmt.Sprintf("%s must be at least %s characters long", field, err.Param())
	case "max":
		return fmt.Sprintf("%s must be at most %s characters long", field, err.Param())
	case "noempty":
		return fmt.Sprintf("%s cannot be empty or contain only whitespace", field)
	case "alphanumeric":
		return fmt.Sprintf("%s must contain only letters and numbers", field)
	case "strongpassword":
		return fmt.Sprintf("%s must be at least 8 characters with uppercase, lowercase, digit, and special character", field)
	case "url":
		return fmt.Sprintf("%s must be a valid URL", field)
	default:
		return fmt.Sprintf("%s is invalid", field)
	}
}

// Sanitize string input
func sanitizeString(input string) string {
	// Remove potentially dangerous characters
	dangerous := []string{"<", ">", "&", "\"", "'", "/", "\\", ";", "(", ")", "{", "}", "[", "]"}
	result := input
	
	for _, char := range dangerous {
		result = strings.ReplaceAll(result, char, "")
	}
	
	// Trim whitespace
	result = strings.TrimSpace(result)
	
	return result
}