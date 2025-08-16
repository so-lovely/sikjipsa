package handlers

import (
	"fmt"
	"sikjipsa-backend/internal/middleware"
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/cache"
	"sikjipsa-backend/pkg/config"
	"sikjipsa-backend/pkg/logger"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func SetupRoutes(app fiber.Router, db *gorm.DB, cfg *config.Config, redisCache *cache.RedisCache) {
    // Database migrations
    logger.Info("Starting database migrations")
    
    models := []interface{}{
        &models.User{},
        &models.PlantCategory{},
        &models.Plant{},
        &models.CommunityPost{},
        &models.PostComment{},
        &models.PostLike{},
        &models.GrowthDiary{},
        &models.DiaryEntry{},
        &models.DiagnosisRequest{},
        &models.Announcement{},
    }
    
    for _, model := range models {
        if err := db.AutoMigrate(model); err != nil {
            logger.Error("Migration failed", "model", fmt.Sprintf("%T", model), "error", err)
        }
    }
    
    logger.Info("Database migrations completed")
    
    // 나머지 핸들러 초기화 코드...

	// Initialize handlers
	authHandler := NewAuthHandler(db, cfg)
	tokenHandler := NewTokenHandler(db, cfg)
	plantHandler := NewPlantHandler(db, cfg, redisCache)
	communityHandler := NewCommunityHandler(db, cfg, redisCache)
	diaryHandler := NewDiaryHandler(db, cfg, redisCache)
	diagnosisHandler := NewDiagnosisHandler(db, cfg, redisCache)
	announcementHandler := NewAnnouncementHandler(db, cfg, redisCache)

	// Auth routes - Social login only with strict rate limiting
	auth := app.Group("/auth")
	auth.Post("/naver", middleware.SetupAuthRateLimit(), authHandler.NaverLogin)
	auth.Post("/kakao", middleware.SetupAuthRateLimit(), authHandler.KakaoLogin)
	auth.Get("/me", middleware.AuthRequired(cfg.JWTSecret), authHandler.Me)
	auth.Put("/profile", middleware.AuthRequired(cfg.JWTSecret), authHandler.UpdateProfile)
	auth.Delete("/account", middleware.AuthRequired(cfg.JWTSecret), authHandler.DeleteAccount)
	
	// Token management routes
	auth.Post("/refresh", tokenHandler.RefreshToken)
	auth.Post("/revoke", middleware.AuthRequired(cfg.JWTSecret), tokenHandler.RevokeToken)
	
	logger.Info("Auth routes registered", 
		"routes", []string{
			"POST /api/v1/auth/naver",
			"POST /api/v1/auth/kakao", 
			"GET /api/v1/auth/me",
			"PUT /api/v1/auth/profile",
			"DELETE /api/v1/auth/account",
			"POST /api/v1/auth/refresh",
			"POST /api/v1/auth/revoke",
		})

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
	
	// Image upload for rich text editor with upload rate limiting
	community.Post("/upload-image", middleware.SetupUploadRateLimit(), middleware.AuthRequired(cfg.JWTSecret), communityHandler.UploadImage)

	// Diary routes with upload rate limiting for image uploads
	diary := app.Group("/diary")
	diary.Get("/", middleware.AuthRequired(cfg.JWTSecret), diaryHandler.GetUserDiaries)
	diary.Post("/", middleware.AuthRequired(cfg.JWTSecret), diaryHandler.CreateDiary)
	diary.Get("/:id", middleware.AuthRequired(cfg.JWTSecret), diaryHandler.GetDiary)
	diary.Post("/:id/entries", middleware.SetupUploadRateLimit(), middleware.AuthRequired(cfg.JWTSecret), diaryHandler.AddEntry)
	diary.Put("/:id/entries/:entryId", middleware.SetupUploadRateLimit(), middleware.AuthRequired(cfg.JWTSecret), diaryHandler.UpdateEntry)
	diary.Delete("/:id/entries/:entryId", middleware.AuthRequired(cfg.JWTSecret), diaryHandler.DeleteEntry)
	
	logger.Info("Diary routes registered",
		"routes", []string{
			"GET /api/v1/diary",
			"POST /api/v1/diary",
			"GET /api/v1/diary/:id",
			"POST /api/v1/diary/:id/entries",
			"PUT /api/v1/diary/:id/entries/:entryId",
			"DELETE /api/v1/diary/:id/entries/:entryId",
		})

	// Diagnosis routes with upload rate limiting for image analysis
	diagnosis := app.Group("/diagnosis")
	diagnosis.Post("/analyze", middleware.SetupUploadRateLimit(), middleware.AuthRequired(cfg.JWTSecret), diagnosisHandler.AnalyzePlant)
	diagnosis.Get("/result/:id", diagnosisHandler.GetDiagnosisResult)
	diagnosis.Get("/history", middleware.AuthRequired(cfg.JWTSecret), diagnosisHandler.GetDiagnosisHistory)

	// Announcement routes
	announcements := app.Group("/announcements")
	announcements.Get("/", announcementHandler.GetAnnouncements)
	announcements.Get("/:id", announcementHandler.GetAnnouncement)
	announcements.Post("/", middleware.AuthRequired(cfg.JWTSecret), announcementHandler.CreateAnnouncement)
	announcements.Put("/:id", middleware.AuthRequired(cfg.JWTSecret), announcementHandler.UpdateAnnouncement)
	announcements.Delete("/:id", middleware.AuthRequired(cfg.JWTSecret), announcementHandler.DeleteAnnouncement)
	
	logger.Info("Announcement routes registered",
		"routes", []string{
			"GET /api/v1/announcements",
			"GET /api/v1/announcements/:id",
			"POST /api/v1/announcements",
			"PUT /api/v1/announcements/:id",
			"DELETE /api/v1/announcements/:id",
		})

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"message": "Sikjipsa API is running",
		})
	})
}