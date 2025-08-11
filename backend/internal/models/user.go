package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID             uint   `json:"id" gorm:"primaryKey"`
	Email          string `json:"email" gorm:"uniqueIndex;not null"`
	Username       string `json:"username" gorm:"uniqueIndex;not null"`
	Role           string `json:"role" gorm:"default:user;not null"`
	ProfileImage   string `json:"profile_image"`
	SocialProvider string `json:"social_provider"`
	SocialID       string `json:"social_id"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

func (User) TableName() string {
	return "users"
}