package database

import (
	"log"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func Connect(databaseURL string) *gorm.DB {
	var db *gorm.DB
	var err error

	// Support both PostgreSQL and SQLite for local development
	if strings.Contains(databaseURL, "sqlite") || strings.HasSuffix(databaseURL, ".db") {
		// SQLite connection
		db, err = gorm.Open(sqlite.Open(databaseURL), &gorm.Config{})
	} else {
		// PostgreSQL connection
		db, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	}

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully")
	return db
}

func AutoMigrate(db *gorm.DB, models ...interface{}) {
	err := db.AutoMigrate(models...)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	log.Println("Database migration completed")
}