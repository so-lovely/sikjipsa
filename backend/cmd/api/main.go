package main

import (
	"log"
	"sikjipsa-backend/internal/handlers"
	"sikjipsa-backend/internal/middleware"
	"sikjipsa-backend/pkg/config"
	"sikjipsa-backend/pkg/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	cfg := config.Load()
	
	db := database.Connect(cfg.DatabaseURL)

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		BodyLimit:    25 * 1024 * 1024, // 25MB limit for multiple image uploads
	})

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	// Add rate limiting
	app.Use(middleware.SetupRateLimit())
	
	// Add input sanitization
	app.Use(middleware.SanitizeInput())

	api := app.Group("/api/v1")
	
	handlers.SetupRoutes(api, db, cfg)

	log.Printf("Server starting on port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}