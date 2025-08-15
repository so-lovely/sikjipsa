package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID             uint   `json:"id" gorm:"primaryKey"`
	Email          string `json:"email" gorm:"uniqueIndex;not null;index"`
	Username       string `json:"username" gorm:"not null;index"`
	Role           string `json:"role" gorm:"default:user;not null;index"`
	ProfileImage   string `json:"profile_image"`
	SocialProvider string `json:"social_provider" gorm:"index"`
	SocialID       string `json:"social_id" gorm:"index"`
	CreatedAt      time.Time `json:"created_at" gorm:"index"`
	UpdatedAt      time.Time `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

func (User) TableName() string {
	return "users"
}