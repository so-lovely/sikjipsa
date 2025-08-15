package tests

import (
	"log"
	"os"
	"sikjipsa-backend/pkg/config"
	"sikjipsa-backend/pkg/database"
	"testing"

	"gorm.io/gorm"
)

var TestDB *gorm.DB

func TestMain(m *testing.M) {
	// Setup test database
	testDBURL := getTestDatabaseURL()
	if testDBURL != "" {
		cfg := &config.Config{
			DatabaseURL: testDBURL,
		}
		TestDB = database.Connect(cfg.DatabaseURL)
	}
	
	// Run tests
	code := m.Run()
	
	// Cleanup
	cleanup()
	
	os.Exit(code)
}

func getTestDatabaseURL() string {
	// Use in-memory SQLite for testing or test database
	testDB := os.Getenv("TEST_DATABASE_URL")
	if testDB == "" {
		// Skip database tests if no test database is configured
		log.Println("TEST_DATABASE_URL not set, skipping database tests")
		return ""
	}
	return testDB
}

func cleanup() {
	if TestDB != nil {
		sqlDB, err := TestDB.DB()
		if err != nil {
			log.Printf("Error getting underlying sql.DB: %v", err)
			return
		}
		sqlDB.Close()
	}
}

// Helper function to setup test database with migrations
func SetupTestDB(t *testing.T) *gorm.DB {
	if TestDB == nil {
		t.Skip("Test database not available - set TEST_DATABASE_URL environment variable")
	}
	return TestDB
}