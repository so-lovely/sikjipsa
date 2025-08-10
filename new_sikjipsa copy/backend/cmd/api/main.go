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
	})

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	api := app.Group("/api/v1")
	
	handlers.SetupRoutes(api, db, cfg)

	log.Printf("Server starting on port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}