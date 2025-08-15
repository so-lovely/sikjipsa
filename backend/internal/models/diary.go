package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type GrowthDiary struct {
	ID           uint         `json:"id" gorm:"primaryKey"`
	UserID       uint         `json:"user_id" gorm:"index"`
	User         User         `json:"user" gorm:"foreignKey:UserID"`
	PlantID      uint         `json:"plant_id" gorm:"index"`
	Plant        Plant        `json:"plant" gorm:"foreignKey:PlantID"`
	PlantNickname string      `json:"plant_nickname" gorm:"index"`
	StartDate    time.Time    `json:"start_date" gorm:"not null;index"`
	Entries      []DiaryEntry `json:"entries" gorm:"foreignKey:DiaryID"`
	CreatedAt    time.Time    `json:"created_at" gorm:"index"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

type DiaryEntry struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	DiaryID      uint           `json:"diary_id" gorm:"index"`
	EntryDate    time.Time      `json:"entry_date" gorm:"not null;index"`
	Title        string         `json:"title" gorm:"index"`
	Content      string         `json:"content"`
	Images       datatypes.JSON `json:"images,omitempty"`
	GrowthStage  string         `json:"growth_stage" gorm:"index"`
	CreatedAt    time.Time      `json:"created_at" gorm:"index"`
}


func (GrowthDiary) TableName() string {
	return "growth_diaries"
}

func (DiaryEntry) TableName() string {
	return "diary_entries"
}

