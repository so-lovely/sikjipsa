package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type PlantCategory struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url"`
	CreatedAt   time.Time `json:"created_at"`
}

type Plant struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	CategoryID       uint           `json:"category_id"`
	Category         PlantCategory  `json:"category" gorm:"foreignKey:CategoryID;references:ID"`
	Name             string         `json:"name" gorm:"not null"`
	ScientificName   string         `json:"scientific_name"`
	Description      string         `json:"description"`
	CareInstructions string         `json:"care_instructions"`
	Images           datatypes.JSON `json:"images"`
	DifficultyLevel  string         `json:"difficulty_level"`
	LightRequirement string         `json:"light_requirement"`
	WaterFrequency   string         `json:"water_frequency"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
}

func (PlantCategory) TableName() string {
	return "plant_categories"
}

func (Plant) TableName() string {
	return "plants"
}