package handlers

import (
	"context"
	"fmt"
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/cache"
	"sikjipsa-backend/pkg/config"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type PlantHandler struct {
	db    *gorm.DB
	cfg   *config.Config
	cache *cache.RedisCache
}

func NewPlantHandler(db *gorm.DB, cfg *config.Config, redisCache *cache.RedisCache) *PlantHandler {
	return &PlantHandler{db: db, cfg: cfg, cache: redisCache}
}

func (h *PlantHandler) GetCategories(c *fiber.Ctx) error {
	ctx := context.Background()
	cacheKey := "categories"

	// Check cache first
	var categories []models.PlantCategory
	if h.cache.IsAvailable() {
		if err := h.cache.Get(ctx, cacheKey, &categories); err == nil {
			return c.JSON(categories)
		}
	}

	// Use Table method to be explicit about table name
	if err := h.db.Table("plant_categories").Find(&categories).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch categories",
		})
	}

	// Cache the result for 24 hours
	if h.cache.IsAvailable() {
		h.cache.Set(ctx, cacheKey, categories, 24*time.Hour)
	}

	return c.JSON(categories)
}

func (h *PlantHandler) GetPlants(c *fiber.Ctx) error {
	ctx := context.Background()
	
	// Generate cache key from query parameters
	cacheKey := fmt.Sprintf("plants_%s_%s_%s_%s", 
		c.Query("category"), 
		c.Query("search"), 
		c.Query("page", "1"), 
		c.Query("limit"))
	
	// Check cache first
	var response fiber.Map
	if h.cache.IsAvailable() {
		if err := h.cache.Get(ctx, cacheKey, &response); err == nil {
			return c.JSON(response)
		}
	}

	var plants []models.Plant
	query := h.db.Table("plants").Preload("Category").Where("plants.deleted_at IS NULL")

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
		fmt.Printf("Query error: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch plants",
		})
	}
	
	fmt.Printf("Found %d plants\n", len(plants))

	// Count total
	var total int64
	countQuery := h.db.Table("plants").Where("deleted_at IS NULL")
	if categoryID := c.Query("category"); categoryID != "" {
		countQuery = countQuery.Where("category_id = ?", categoryID)
	}
	if search := c.Query("search"); search != "" {
		countQuery = countQuery.Where("name ILIKE ? OR scientific_name ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	countQuery.Count(&total)

	response = fiber.Map{
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

	// Cache the response for 1 hour
	if h.cache.IsAvailable() {
		h.cache.Set(ctx, cacheKey, response, time.Hour)
	}

	return c.JSON(response)
}

func (h *PlantHandler) GetPlant(c *fiber.Ctx) error {
	ctx := context.Background()
	id := c.Params("id")
	cacheKey := fmt.Sprintf("plant_%s", id)
	
	// Check cache first
	var plant models.Plant
	if h.cache.IsAvailable() {
		if err := h.cache.Get(ctx, cacheKey, &plant); err == nil {
			return c.JSON(plant)
		}
	}

	if err := h.db.Table("plants").Preload("Category").Where("plants.id = ?", id).First(&plant).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Plant not found",
		})
	}

	// Cache the result for 24 hours
	if h.cache.IsAvailable() {
		h.cache.Set(ctx, cacheKey, plant, 24*time.Hour)
	}

	return c.JSON(plant)
}

