package handlers

import (
	"context"
	"encoding/json"
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/config"
	"sikjipsa-backend/pkg/logger"
	"strconv"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type DiaryHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewDiaryHandler(db *gorm.DB, cfg *config.Config) *DiaryHandler {
	return &DiaryHandler{db: db, cfg: cfg}
}

type CreateDiaryRequest struct {
	PlantID       uint      `json:"plant_id"`
	PlantNickname string    `json:"plant_nickname"`
	StartDate     time.Time `json:"start_date"`
}

func (h *DiaryHandler) GetUserDiaries(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var diaries []models.GrowthDiary
	if err := h.db.Preload("Plant").Preload("Entries").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&diaries).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch diaries",
		})
	}

	return c.JSON(diaries)
}

func (h *DiaryHandler) CreateDiary(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var req CreateDiaryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Check if plant exists
	var plant models.Plant
	if err := h.db.First(&plant, req.PlantID).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Plant not found",
		})
	}

	// Convert userID to uint safely
	var uid uint
	switch v := userID.(type) {
	case float64:
		uid = uint(v)
	case uint:
		uid = v
	case int:
		uid = uint(v)
	default:
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	diary := models.GrowthDiary{
		UserID:        uid,
		PlantID:       req.PlantID,
		PlantNickname: req.PlantNickname,
		StartDate:     req.StartDate,
	}

	if err := h.db.Create(&diary).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create diary",
		})
	}

	// Load with plant data
	h.db.Preload("Plant").First(&diary, diary.ID)

	return c.JSON(diary)
}

func (h *DiaryHandler) GetDiary(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	diaryID := c.Params("id")
	var diary models.GrowthDiary

	if err := h.db.Preload("Plant").Preload("Entries").
		Where("id = ? AND user_id = ?", diaryID, userID).
		First(&diary).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Diary not found",
		})
	}

	// Note: Image data is stored as JSON in the database

	return c.JSON(diary)
}

type AddEntryRequest struct {
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Images      []string  `json:"images"`
	GrowthStage string    `json:"growth_stage"`
	EntryDate   time.Time `json:"entry_date"`
}

func (h *DiaryHandler) AddEntry(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// userID 타입 변환
	var uid uint
	switch v := userID.(type) {
	case float64:
		uid = uint(v)
	case int:
		uid = uint(v)
	case uint:
		uid = v
	default:
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID type",
		})
	}

	diaryID := c.Params("id")
	
	// Verify diary ownership
	var diary models.GrowthDiary
	if err := h.db.Where("id = ? AND user_id = ?", diaryID, uid).First(&diary).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Diary not found",
		})
	}

	// 폼 데이터에서 텍스트 필드 읽기
	title := c.FormValue("title")
	content := c.FormValue("content")
	growthStage := c.FormValue("growth_stage")
	entryDateStr := c.FormValue("entry_date")

	if content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Content is required",
		})
	}

	// Parse entry date
	entryDate := time.Now()
	if entryDateStr != "" {
		if parsedDate, err := time.Parse("2006-01-02", entryDateStr); err == nil {
			entryDate = parsedDate
		}
	}

	// Parse diary ID
	parsedDiaryID, err := strconv.ParseUint(diaryID, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid diary ID",
		})
	}

	logger.Info("Creating diary entry", "title", title, "growthStage", growthStage)

	// Cloudinary 설정
	cld, err := cloudinary.NewFromParams(h.cfg.CloudinaryCloudName, h.cfg.CloudinaryAPIKey, h.cfg.CloudinaryAPISecret)
	if err != nil {
		logger.Error("Failed to initialize Cloudinary", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initialize image upload service",
		})
	}

	// 이미지 파일 처리
	form, err := c.MultipartForm()
	var imageUrls []string
	
	if err == nil && form.File["images"] != nil {
		files := form.File["images"]
		logger.Info("Processing diary entry images", "count", len(files))
		
		for _, file := range files {
			// 파일 검증
			if !isValidImageFile(file) {
				logger.Warn("Invalid image file skipped", "filename", file.Filename)
				continue
			}
			
			// 파일 열기
			src, err := file.Open()
			if err != nil {
				logger.Error("Failed to open image file", "filename", file.Filename, "error", err)
				continue
			}
			defer src.Close()

			// Cloudinary에 업로드
			uploadResult, err := cld.Upload.Upload(context.Background(), src, uploader.UploadParams{
				Folder:         "sikjipsa/diary",
				ResourceType:   "image",
				Transformation: "c_limit,w_800,h_800,q_auto:good",
			})
			
			if err != nil {
				logger.Error("Failed to upload image to Cloudinary", "filename", file.Filename, "error", err)
				continue
			}

			imageUrls = append(imageUrls, uploadResult.SecureURL)
			logger.Info("Image uploaded successfully", "url", uploadResult.SecureURL)
		}
	}

	entry := models.DiaryEntry{
		DiaryID:     uint(parsedDiaryID),
		Title:       title,
		Content:     content,
		GrowthStage: growthStage,
		EntryDate:   entryDate,
	}

	// 이미지 URL들을 JSON으로 저장
	if len(imageUrls) > 0 {
		jsonImages, err := json.Marshal(imageUrls)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to process images",
			})
		}
		entry.Images = jsonImages
		logger.Info("Stored diary entry images", "imageCount", len(imageUrls))
	}

	if err := h.db.Create(&entry).Error; err != nil {
		logger.Error("Failed to create diary entry in database", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add entry",
		})
	}

	logger.Info("Diary entry created successfully", "entryID", entry.ID)
	return c.JSON(entry)
}

func (h *DiaryHandler) UpdateEntry(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// userID 타입 변환
	var uid uint
	switch v := userID.(type) {
	case float64:
		uid = uint(v)
	case int:
		uid = uint(v)
	case uint:
		uid = v
	default:
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID type",
		})
	}

	diaryID := c.Params("id")
	entryID := c.Params("entryId")

	// Verify diary ownership
	var diary models.GrowthDiary
	if err := h.db.Where("id = ? AND user_id = ?", diaryID, uid).First(&diary).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Diary not found",
		})
	}

	// Find and verify entry ownership
	var entry models.DiaryEntry
	if err := h.db.Where("id = ? AND diary_id = ?", entryID, diaryID).First(&entry).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Entry not found",
		})
	}

	// 폼 데이터에서 텍스트 필드 읽기
	title := c.FormValue("title")
	content := c.FormValue("content")
	growthStage := c.FormValue("growth_stage")
	entryDateStr := c.FormValue("entry_date")
	existingImagesStr := c.FormValue("existing_images")

	if content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Content is required",
		})
	}

	// Parse entry date
	entryDate := entry.EntryDate
	if entryDateStr != "" {
		if parsedDate, err := time.Parse("2006-01-02", entryDateStr); err == nil {
			entryDate = parsedDate
		}
	}

	// 기존 이미지 파싱
	var existingImages []string
	if existingImagesStr != "" {
		if err := json.Unmarshal([]byte(existingImagesStr), &existingImages); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid existing images format",
			})
		}
	}

	logger.Info("Updating diary entry", "title", title, "growthStage", growthStage)

	// Cloudinary 설정
	cld, err := cloudinary.NewFromParams(h.cfg.CloudinaryCloudName, h.cfg.CloudinaryAPIKey, h.cfg.CloudinaryAPISecret)
	if err != nil {
		logger.Error("Failed to initialize Cloudinary", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initialize image upload service",
		})
	}

	// 새로운 이미지 파일 처리
	form, err := c.MultipartForm()
	var newImageUrls []string
	
	if err == nil && form.File["images"] != nil {
		files := form.File["images"]
		logger.Info("Processing new images for diary entry update", "count", len(files))
		
		for _, file := range files {
			// 파일 검증
			if !isValidImageFile(file) {
				logger.Warn("Invalid image file skipped", "filename", file.Filename)
				continue
			}
			
			// 파일 열기
			src, err := file.Open()
			if err != nil {
				logger.Error("Failed to open image file", "filename", file.Filename, "error", err)
				continue
			}
			defer src.Close()

			// Cloudinary에 업로드
			uploadResult, err := cld.Upload.Upload(context.Background(), src, uploader.UploadParams{
				Folder:         "sikjipsa/diary",
				ResourceType:   "image",
				Transformation: "c_limit,w_800,h_800,q_auto:good",
			})
			
			if err != nil {
				logger.Error("Failed to upload image to Cloudinary", "filename", file.Filename, "error", err)
				continue
			}

			newImageUrls = append(newImageUrls, uploadResult.SecureURL)
			logger.Info("Image uploaded successfully", "url", uploadResult.SecureURL)
		}
	}

	// 기존 이미지와 새 이미지 합치기
	allImages := append(existingImages, newImageUrls...)

	// 엔트리 업데이트
	entry.Title = title
	entry.Content = content
	entry.GrowthStage = growthStage
	entry.EntryDate = entryDate

	// 이미지 URL들을 JSON으로 저장
	if len(allImages) > 0 {
		jsonImages, err := json.Marshal(allImages)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to process images",
			})
		}
		entry.Images = jsonImages
		logger.Info("Updated diary entry images", "totalImages", len(allImages))
	} else {
		entry.Images = nil
	}

	if err := h.db.Save(&entry).Error; err != nil {
		logger.Error("Failed to update diary entry in database", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update entry",
		})
	}

	logger.Info("Diary entry updated successfully", "entryID", entry.ID)
	return c.JSON(entry)
}

func (h *DiaryHandler) DeleteEntry(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// userID 타입 변환
	var uid uint
	switch v := userID.(type) {
	case float64:
		uid = uint(v)
	case int:
		uid = uint(v)
	case uint:
		uid = v
	default:
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID type",
		})
	}

	diaryID := c.Params("id")
	entryID := c.Params("entryId")

	// Verify diary ownership
	var diary models.GrowthDiary
	if err := h.db.Where("id = ? AND user_id = ?", diaryID, uid).First(&diary).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Diary not found",
		})
	}

	// Find and verify entry ownership
	var entry models.DiaryEntry
	if err := h.db.Where("id = ? AND diary_id = ?", entryID, diaryID).First(&entry).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Entry not found",
		})
	}

	// Delete the entry
	if err := h.db.Delete(&entry).Error; err != nil {
		logger.Error("Failed to delete diary entry from database", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete entry",
		})
	}

	logger.Info("Diary entry deleted successfully", "entryID", entry.ID)
	return c.JSON(fiber.Map{
		"message": "Entry deleted successfully",
	})
}


