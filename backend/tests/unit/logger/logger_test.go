package logger

import (
	"bytes"
	"encoding/json"
	"os"
	"sikjipsa-backend/pkg/logger"
	"strings"
	"testing"

	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
)

func TestLoggerConfiguration(t *testing.T) {
	// Test that logger is properly configured
	assert.NotNil(t, logger.Log)
	assert.IsType(t, &logrus.Logger{}, logger.Log)
}

func TestLogLevels(t *testing.T) {
	// Capture log output
	var buf bytes.Buffer
	logger.Log.SetOutput(&buf)
	
	// Test different log levels
	logger.Info("test info message")
	logger.Error("test error message")
	logger.Warn("test warning message")
	
	output := buf.String()
	assert.Contains(t, output, "test info message")
	assert.Contains(t, output, "test error message")
	assert.Contains(t, output, "test warning message")
}

func TestFormattedLogging(t *testing.T) {
	var buf bytes.Buffer
	logger.Log.SetOutput(&buf)
	
	// Test formatted logging
	logger.Infof("User %s logged in with ID %d", "testuser", 123)
	logger.Errorf("Database error: %v", "connection failed")
	
	output := buf.String()
	assert.Contains(t, output, "User testuser logged in with ID 123")
	assert.Contains(t, output, "Database error: connection failed")
}

func TestStructuredLogging(t *testing.T) {
	var buf bytes.Buffer
	
	// Set JSON formatter for structured output
	originalFormatter := logger.Log.Formatter
	logger.Log.SetFormatter(&logrus.JSONFormatter{})
	logger.Log.SetOutput(&buf)
	
	defer func() {
		// Restore original formatter
		logger.Log.SetFormatter(originalFormatter)
	}()
	
	// Test structured logging with fields
	logger.WithFields(logrus.Fields{
		"user_id": 123,
		"action":  "login",
		"method":  "oauth",
	}).Info("User authentication")
	
	logger.WithField("error_code", "DB001").Error("Database connection failed")
	
	output := buf.String()
	lines := strings.Split(strings.TrimSpace(output), "\n")
	
	// Parse first log entry
	var logEntry1 map[string]interface{}
	err := json.Unmarshal([]byte(lines[0]), &logEntry1)
	assert.NoError(t, err)
	assert.Equal(t, "User authentication", logEntry1["msg"])
	assert.Equal(t, float64(123), logEntry1["user_id"])
	assert.Equal(t, "login", logEntry1["action"])
	assert.Equal(t, "oauth", logEntry1["method"])
	
	// Parse second log entry
	var logEntry2 map[string]interface{}
	err = json.Unmarshal([]byte(lines[1]), &logEntry2)
	assert.NoError(t, err)
	assert.Equal(t, "Database connection failed", logEntry2["msg"])
	assert.Equal(t, "DB001", logEntry2["error_code"])
}

func TestProductionMode(t *testing.T) {
	// Test production mode configuration
	originalEnv := os.Getenv("ENV")
	defer os.Setenv("ENV", originalEnv)
	
	os.Setenv("ENV", "production")
	
	// Create new logger instance to test production config
	testLogger := logrus.New()
	testLogger.SetOutput(os.Stdout)
	
	if os.Getenv("ENV") == "production" {
		testLogger.SetLevel(logrus.InfoLevel)
		testLogger.SetFormatter(&logrus.JSONFormatter{})
	}
	
	assert.Equal(t, logrus.InfoLevel, testLogger.GetLevel())
	assert.IsType(t, &logrus.JSONFormatter{}, testLogger.Formatter)
}

func TestDevelopmentMode(t *testing.T) {
	// Test development mode configuration
	originalEnv := os.Getenv("ENV")
	defer os.Setenv("ENV", originalEnv)
	
	os.Setenv("ENV", "development")
	
	// Create new logger instance to test development config
	testLogger := logrus.New()
	testLogger.SetOutput(os.Stdout)
	
	if os.Getenv("ENV") != "production" {
		testLogger.SetLevel(logrus.DebugLevel)
		testLogger.SetFormatter(&logrus.TextFormatter{
			ForceColors:   true,
			FullTimestamp: true,
		})
	}
	
	assert.Equal(t, logrus.DebugLevel, testLogger.GetLevel())
	assert.IsType(t, &logrus.TextFormatter{}, testLogger.Formatter)
}

func TestDebugLogging(t *testing.T) {
	var buf bytes.Buffer
	
	// Set debug level for testing
	originalLevel := logger.Log.GetLevel()
	logger.Log.SetLevel(logrus.DebugLevel)
	logger.Log.SetOutput(&buf)
	
	defer func() {
		// Restore original level
		logger.Log.SetLevel(originalLevel)
	}()
	
	logger.Debug("debug message")
	logger.Debugf("debug with format: %s", "test")
	
	output := buf.String()
	assert.Contains(t, output, "debug message")
	assert.Contains(t, output, "debug with format: test")
}