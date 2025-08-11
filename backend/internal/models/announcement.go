package models

import (
	"time"

	"gorm.io/gorm"
)

type Announcement struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Title       string         `json:"title" gorm:"not null"`
	Content     string         `json:"content" gorm:"type:text;not null"`
	AuthorID    uint           `json:"author_id"`
	Author      User           `json:"author" gorm:"foreignKey:AuthorID"`
	IsPinned    bool           `json:"is_pinned" gorm:"default:false"`
	IsPublished bool           `json:"is_published" gorm:"default:true"`
	ViewCount   int            `json:"view_count" gorm:"default:0"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (Announcement) TableName() string {
	return "announcements"
}