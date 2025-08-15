package middleware

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"sikjipsa-backend/internal/middleware"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestValidateJSON(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.ValidateJSON())
	app.Post("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Test valid JSON
	validJSON := `{"test": "value"}`
	req := httptest.NewRequest("POST", "/test", bytes.NewReader([]byte(validJSON)))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	// Test invalid content type
	req = httptest.NewRequest("POST", "/test", bytes.NewReader([]byte(validJSON)))
	req.Header.Set("Content-Type", "text/plain")
	
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	// Test empty body
	req = httptest.NewRequest("POST", "/test", bytes.NewReader([]byte("")))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	// Test invalid JSON format
	invalidJSON := `not json`
	req = httptest.NewRequest("POST", "/test", bytes.NewReader([]byte(invalidJSON)))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestSanitizeInput(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.SanitizeInput())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"query": c.Query("test"),
		})
	})

	// Test query parameter sanitization
	req := httptest.NewRequest("GET", "/test?test=<script>alert('xss')</script>", nil)
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	
	// The dangerous characters should be removed
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	query := result["query"].(string)
	assert.NotContains(t, query, "<")
	assert.NotContains(t, query, ">")
	assert.NotContains(t, query, "'")
}

type TestStruct struct {
	Name  string `json:"name" validate:"required,noempty,min=2,max=50"`
	Email string `json:"email" validate:"required,email"`
	Age   int    `json:"age" validate:"min=0,max=150"`
}

func TestValidateRequest(t *testing.T) {
	app := fiber.New()
	
	app.Post("/test", middleware.ValidateJSON(), middleware.ValidateRequest(&TestStruct{}), func(c *fiber.Ctx) error {
		validated := c.Locals("validated").(*TestStruct)
		return c.JSON(fiber.Map{"validated": validated})
	})

	// Test valid request
	validReq := TestStruct{
		Name:  "John Doe",
		Email: "john@example.com",
		Age:   25,
	}
	body, _ := json.Marshal(validReq)
	req := httptest.NewRequest("POST", "/test", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	// Test validation failure - missing required field
	invalidReq := map[string]interface{}{
		"email": "john@example.com",
		"age":   25,
		// Missing required name field
	}
	body, _ = json.Marshal(invalidReq)
	req = httptest.NewRequest("POST", "/test", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	// Test validation failure - invalid email
	invalidReq = map[string]interface{}{
		"name":  "John Doe",
		"email": "invalid-email",
		"age":   25,
	}
	body, _ = json.Marshal(invalidReq)
	req = httptest.NewRequest("POST", "/test", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	// Test validation failure - age out of range
	invalidReq = map[string]interface{}{
		"name":  "John Doe",
		"email": "john@example.com",
		"age":   -5,
	}
	body, _ = json.Marshal(invalidReq)
	req = httptest.NewRequest("POST", "/test", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}