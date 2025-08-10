package database

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(databaseURL string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
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