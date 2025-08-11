package handlers

import (
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/config"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AnnouncementHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAnnouncementHandler(db *gorm.DB, cfg *config.Config) *AnnouncementHandler {
	return &AnnouncementHandler{
		db:  db,
		cfg: cfg,
	}
}

// GetAnnouncements 공지사항 목록 조회
func (h *AnnouncementHandler) GetAnnouncements(c *fiber.Ctx) error {
	var announcements []models.Announcement
	
	query := h.db.Model(&models.Announcement{}).
		Preload("Author").
		Where("is_published = ?", true).
		Order("is_pinned DESC, created_at DESC")
	
	if err := query.Find(&announcements).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch announcements",
		})
	}

	return c.JSON(fiber.Map{
		"announcements": announcements,
	})
}

// GetAnnouncement 특정 공지사항 조회
func (h *AnnouncementHandler) GetAnnouncement(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid announcement ID",
		})
	}

	var announcement models.Announcement
	if err := h.db.Preload("Author").First(&announcement, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{
				"error": "Announcement not found",
			})
		}
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch announcement",
		})
	}

	// 조회수 증가
	h.db.Model(&announcement).Update("view_count", announcement.ViewCount+1)

	return c.JSON(fiber.Map{
		"announcement": announcement,
	})
}

// CreateAnnouncement 공지사항 생성 (관리자 전용)
func (h *AnnouncementHandler) CreateAnnouncement(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	type CreateAnnouncementRequest struct {
		Title       string `json:"title" validate:"required"`
		Content     string `json:"content" validate:"required"`
		IsPinned    bool   `json:"is_pinned"`
		IsPublished bool   `json:"is_published"`
	}

	var req CreateAnnouncementRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	announcement := models.Announcement{
		Title:       req.Title,
		Content:     req.Content,
		AuthorID:    userID,
		IsPinned:    req.IsPinned,
		IsPublished: req.IsPublished,
	}

	if err := h.db.Create(&announcement).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create announcement",
		})
	}

	// 생성된 공지사항을 Author와 함께 조회
	h.db.Preload("Author").First(&announcement, announcement.ID)

	return c.Status(201).JSON(fiber.Map{
		"announcement": announcement,
	})
}

// UpdateAnnouncement 공지사항 수정 (관리자 전용)
func (h *AnnouncementHandler) UpdateAnnouncement(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid announcement ID",
		})
	}

	type UpdateAnnouncementRequest struct {
		Title       string `json:"title"`
		Content     string `json:"content"`
		IsPinned    *bool  `json:"is_pinned"`
		IsPublished *bool  `json:"is_published"`
	}

	var req UpdateAnnouncementRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var announcement models.Announcement
	if err := h.db.First(&announcement, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{
				"error": "Announcement not found",
			})
		}
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch announcement",
		})
	}

	// 업데이트할 필드들을 맵으로 준비
	updates := make(map[string]interface{})
	
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	if req.IsPinned != nil {
		updates["is_pinned"] = *req.IsPinned
	}
	if req.IsPublished != nil {
		updates["is_published"] = *req.IsPublished
	}

	if err := h.db.Model(&announcement).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update announcement",
		})
	}

	// 업데이트된 공지사항을 Author와 함께 조회
	h.db.Preload("Author").First(&announcement, announcement.ID)

	return c.JSON(fiber.Map{
		"announcement": announcement,
	})
}

// DeleteAnnouncement 공지사항 삭제 (관리자 전용)
func (h *AnnouncementHandler) DeleteAnnouncement(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid announcement ID",
		})
	}

	var announcement models.Announcement
	if err := h.db.First(&announcement, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{
				"error": "Announcement not found",
			})
		}
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch announcement",
		})
	}

	if err := h.db.Delete(&announcement).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to delete announcement",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Announcement deleted successfully",
	})
}