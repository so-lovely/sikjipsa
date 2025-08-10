package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type GrowthDiary struct {
	ID           uint         `json:"id" gorm:"primaryKey"`
	UserID       uint         `json:"user_id"`
	User         User         `json:"user" gorm:"foreignKey:UserID"`
	PlantID      uint         `json:"plant_id"`
	Plant        Plant        `json:"plant" gorm:"foreignKey:PlantID"`
	PlantNickname string      `json:"plant_nickname"`
	StartDate    time.Time    `json:"start_date" gorm:"not null"`
	Entries      []DiaryEntry `json:"entries" gorm:"foreignKey:DiaryID"`
	CreatedAt    time.Time    `json:"created_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

type DiaryEntry struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	DiaryID      uint           `json:"diary_id"`
	EntryDate    time.Time      `json:"entry_date" gorm:"not null"`
	Title        string         `json:"title"`
	Content      string         `json:"content"`
	Images       datatypes.JSON `json:"images,omitempty"`
	GrowthStage  string         `json:"growth_stage"`
	CreatedAt    time.Time      `json:"created_at"`
}


func (GrowthDiary) TableName() string {
	return "growth_diaries"
}

func (DiaryEntry) TableName() string {
	return "diary_entries"
}

