package handlers

import (
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/config"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type PlantHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewPlantHandler(db *gorm.DB, cfg *config.Config) *PlantHandler {
	return &PlantHandler{db: db, cfg: cfg}
}

func (h *PlantHandler) GetCategories(c *fiber.Ctx) error {
	var categories []models.PlantCategory
	
	// Use Table method to be explicit about table name
	if err := h.db.Table("plant_categories").Find(&categories).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch categories",
		})
	}

	return c.JSON(categories)
}

func (h *PlantHandler) GetPlants(c *fiber.Ctx) error {
	var plants []models.Plant
	query := h.db.Table("plants").Preload("Category")

	// Filter by category
	if categoryID := c.Query("category"); categoryID != "" {
		query = query.Where("plants.category_id = ?", categoryID)
	}

	// Search by name
	if search := c.Query("search"); search != "" {
		query = query.Where("plants.name ILIKE ? OR plants.scientific_name ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Pagination - only apply if limit is specified
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limitStr := c.Query("limit")
	
	if limitStr != "" {
		limit, _ := strconv.Atoi(limitStr)
		offset := (page - 1) * limit
		query = query.Limit(limit).Offset(offset)
	}

	if err := query.Find(&plants).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch plants",
		})
	}

	// Count total
	var total int64
	h.db.Table("plants").Where("deleted_at IS NULL").Count(&total)

	response := fiber.Map{
		"plants": plants,
	}

	// Only include pagination info if limit was specified
	if limitStr != "" {
		limit, _ := strconv.Atoi(limitStr)
		response["pagination"] = fiber.Map{
			"page":  page,
			"limit": limit,
			"total": total,
		}
	}

	return c.JSON(response)
}

func (h *PlantHandler) GetPlant(c *fiber.Ctx) error {
	id := c.Params("id")
	var plant models.Plant

	if err := h.db.Table("plants").Preload("Category").Where("plants.id = ?", id).First(&plant).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Plant not found",
		})
	}

	return c.JSON(plant)
}

