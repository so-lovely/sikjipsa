package handlers

import (
	"sikjipsa-backend/internal/middleware"
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/config"
	"log"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func SetupRoutes(app fiber.Router, db *gorm.DB, cfg *config.Config) {
    // 하나씩 마이그레이션
    log.Println("Migrating User...")
    if err := db.AutoMigrate(&models.User{}); err != nil {
        log.Printf("Failed to migrate User: %v", err)
    }
    
    log.Println("Migrating PlantCategory...")
    if err := db.AutoMigrate(&models.PlantCategory{}); err != nil {
        log.Printf("Failed to migrate PlantCategory: %v", err)
    }
    
    log.Println("Migrating Plant...")
    if err := db.AutoMigrate(&models.Plant{}); err != nil {
        log.Printf("Failed to migrate Plant: %v", err)
    }
    
    
    log.Println("Migrating CommunityPost...")
    if err := db.AutoMigrate(&models.CommunityPost{}); err != nil {
        log.Printf("Failed to migrate CommunityPost: %v", err)
    }
    
    log.Println("Migrating PostComment...")
    if err := db.AutoMigrate(&models.PostComment{}); err != nil {
        log.Printf("Failed to migrate PostComment: %v", err)
    }
    
    log.Println("Migrating PostLike...")
    if err := db.AutoMigrate(&models.PostLike{}); err != nil {
        log.Printf("Failed to migrate PostLike: %v", err)
    }
    
    log.Println("Migrating GrowthDiary...")
    if err := db.AutoMigrate(&models.GrowthDiary{}); err != nil {
        log.Printf("Failed to migrate GrowthDiary: %v", err)
    }
    
    log.Println("Migrating DiaryEntry...")
    if err := db.AutoMigrate(&models.DiaryEntry{}); err != nil {
        log.Printf("Failed to migrate DiaryEntry: %v", err)
    }
    
    log.Println("Migrating DiagnosisRequest...")
    if err := db.AutoMigrate(&models.DiagnosisRequest{}); err != nil {
        log.Printf("Failed to migrate DiagnosisRequest: %v", err)
    }
    
    log.Println("Migrating Announcement...")
    if err := db.AutoMigrate(&models.Announcement{}); err != nil {
        log.Printf("Failed to migrate Announcement: %v", err)
    }
    
    log.Println("All migrations completed successfully")
    
    // 나머지 핸들러 초기화 코드...

	// Initialize handlers
	authHandler := NewAuthHandler(db, cfg)
	plantHandler := NewPlantHandler(db, cfg)
	communityHandler := NewCommunityHandler(db, cfg)
	diaryHandler := NewDiaryHandler(db, cfg)
	diagnosisHandler := NewDiagnosisHandler(db, cfg)
	announcementHandler := NewAnnouncementHandler(db, cfg)

	// Auth routes
	auth := app.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/naver", authHandler.NaverLogin)
	auth.Post("/kakao", authHandler.KakaoLogin)
	auth.Get("/me", middleware.AuthRequired(cfg.JWTSecret), authHandler.Me)
	auth.Put("/profile", middleware.AuthRequired(cfg.JWTSecret), authHandler.UpdateProfile)
	
	log.Println("✅ Auth routes registered:")
	log.Println("  POST /api/v1/auth/register")
	log.Println("  POST /api/v1/auth/login") 
	log.Println("  POST /api/v1/auth/naver")
	log.Println("  POST /api/v1/auth/kakao")
	log.Println("  GET  /api/v1/auth/me")
	log.Println("  PUT  /api/v1/auth/profile")

	// Plant routes
	plants := app.Group("/plants")
	plants.Get("/", middleware.OptionalAuth(cfg.JWTSecret), plantHandler.GetPlants)
	plants.Get("/categories", plantHandler.GetCategories)
	plants.Get("/:id", middleware.OptionalAuth(cfg.JWTSecret), plantHandler.GetPlant)


	// Community routes
	community := app.Group("/community")
	community.Get("/posts", middleware.OptionalAuth(cfg.JWTSecret), communityHandler.GetPosts)
	community.Post("/posts", middleware.AuthRequired(cfg.JWTSecret), communityHandler.CreatePost)
	community.Get("/posts/:id", middleware.OptionalAuth(cfg.JWTSecret), communityHandler.GetPost)
	community.Put("/posts/:id", middleware.AuthRequired(cfg.JWTSecret), communityHandler.UpdatePost)
	community.Delete("/posts/:id", middleware.AuthRequired(cfg.JWTSecret), communityHandler.DeletePost)
	community.Post("/posts/:id/like", middleware.AuthRequired(cfg.JWTSecret), communityHandler.LikePost)
	community.Post("/posts/:id/comments", middleware.AuthRequired(cfg.JWTSecret), communityHandler.AddComment)
	community.Put("/posts/:id/comments/:commentId", middleware.AuthRequired(cfg.JWTSecret), communityHandler.UpdateComment)
	community.Delete("/posts/:id/comments/:commentId", middleware.AuthRequired(cfg.JWTSecret), communityHandler.DeleteComment)

	// Diary routes
	diary := app.Group("/diary")
	diary.Get("/", middleware.AuthRequired(cfg.JWTSecret), diaryHandler.GetUserDiaries)
	diary.Post("/", middleware.AuthRequired(cfg.JWTSecret), diaryHandler.CreateDiary)
	diary.Get("/:id", middleware.AuthRequired(cfg.JWTSecret), diaryHandler.GetDiary)
	diary.Post("/:id/entries", middleware.AuthRequired(cfg.JWTSecret), diaryHandler.AddEntry)
	diary.Put("/:id/entries/:entryId", middleware.AuthRequired(cfg.JWTSecret), diaryHandler.UpdateEntry)
	diary.Delete("/:id/entries/:entryId", middleware.AuthRequired(cfg.JWTSecret), diaryHandler.DeleteEntry)
	
	log.Println("✅ Diary routes registered:")
	log.Println("  GET  /api/v1/diary")
	log.Println("  POST /api/v1/diary")
	log.Println("  GET  /api/v1/diary/:id")
	log.Println("  POST /api/v1/diary/:id/entries")
	log.Println("  PUT  /api/v1/diary/:id/entries/:entryId")
	log.Println("  DELETE /api/v1/diary/:id/entries/:entryId")

	// Diagnosis routes
	diagnosis := app.Group("/diagnosis")
	diagnosis.Post("/analyze", middleware.AuthRequired(cfg.JWTSecret), diagnosisHandler.AnalyzePlant)
	diagnosis.Get("/result/:id", diagnosisHandler.GetDiagnosisResult)
	diagnosis.Get("/history", middleware.AuthRequired(cfg.JWTSecret), diagnosisHandler.GetDiagnosisHistory)

	// Announcement routes
	announcements := app.Group("/announcements")
	announcements.Get("/", announcementHandler.GetAnnouncements)
	announcements.Get("/:id", announcementHandler.GetAnnouncement)
	announcements.Post("/", middleware.AuthRequired(cfg.JWTSecret), announcementHandler.CreateAnnouncement)
	announcements.Put("/:id", middleware.AuthRequired(cfg.JWTSecret), announcementHandler.UpdateAnnouncement)
	announcements.Delete("/:id", middleware.AuthRequired(cfg.JWTSecret), announcementHandler.DeleteAnnouncement)
	
	log.Println("✅ Announcement routes registered:")
	log.Println("  GET  /api/v1/announcements")
	log.Println("  GET  /api/v1/announcements/:id")
	log.Println("  POST /api/v1/announcements")
	log.Println("  PUT  /api/v1/announcements/:id")
	log.Println("  DELETE /api/v1/announcements/:id")

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"message": "Sikjipsa API is running",
		})
	})
}