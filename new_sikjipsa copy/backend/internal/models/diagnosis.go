package models

import (
	"time"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// DiagnosisRequest stores AI plant diagnosis requests and results
type DiagnosisRequest struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id"`
	User        User           `json:"user" gorm:"foreignKey:UserID"`
	ImageURL    string         `json:"image_url" gorm:"column:plant_image;not null"`
	
	// Plant Identification Results
	PlantName         string         `json:"plant_name"`
	ScientificName    string         `json:"scientific_name"`
	Confidence        float64        `json:"confidence"`
	
	// Health Assessment Results
	IsHealthy         bool           `json:"is_healthy"`
	HealthConfidence  float64        `json:"health_confidence"`
	Diseases          datatypes.JSON `json:"diseases"`          // Array of detected diseases
	Suggestions       datatypes.JSON `json:"suggestions"`       // Array of treatment suggestions
	
	// API Response Data
	APIResponse       datatypes.JSON `json:"api_response"`      // Full API response for reference
	Status            string         `json:"status" gorm:"default:pending"` // pending, processing, completed, failed
	ErrorMessage      string         `json:"error_message"`
	
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`
}

// PlantIdentification represents a single plant identification result
type PlantIdentification struct {
	PlantName      string  `json:"plant_name"`
	ScientificName string  `json:"scientific_name"`
	Confidence     float64 `json:"confidence"`
}

// DiseaseAssessment represents a detected disease
type DiseaseAssessment struct {
	DiseaseName string  `json:"disease_name"`
	Confidence  float64 `json:"confidence"`
	Description string  `json:"description"`
	Treatment   string  `json:"treatment"`
}

// DiagnosisSuggestion represents care suggestions
type DiagnosisSuggestion struct {
	Category string `json:"category"` // watering, lighting, nutrition, treatment, etc.
	Message  string `json:"message"`
}

func (DiagnosisRequest) TableName() string {
	return "diagnosis_requests"
}