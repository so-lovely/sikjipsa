package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type CommunityPost struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	UserID     uint           `json:"user_id" gorm:"index"`
	User       User           `json:"user" gorm:"foreignKey:UserID"`
	Title      string         `json:"title" gorm:"not null;index"`
	Content    string         `json:"content" gorm:"not null"`
	Images     datatypes.JSON `json:"images"`
	PostType   string         `json:"post_type" gorm:"default:general;index"`
	LikesCount int            `json:"likes_count" gorm:"default:0;index"`
	Comments   []PostComment  `json:"comments" gorm:"foreignKey:PostID"`
	Likes      []PostLike     `json:"likes" gorm:"foreignKey:PostID"`
	CreatedAt  time.Time      `json:"created_at" gorm:"index"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

type PostComment struct {
	ID        uint             `json:"id" gorm:"primaryKey"`
	PostID    uint             `json:"post_id" gorm:"index"`
	UserID    uint             `json:"user_id" gorm:"index"`
	User      User             `json:"user" gorm:"foreignKey:UserID"`
	Content   string           `json:"content" gorm:"not null"`
	ParentID  *uint            `json:"parent_id" gorm:"index"` // 답글용 부모 댓글 ID
	Parent    *PostComment     `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Replies   []PostComment    `json:"replies,omitempty" gorm:"foreignKey:ParentID"`
	IsDeleted bool             `json:"is_deleted" gorm:"default:false;index"` // 삭제된 댓글 표시
	CreatedAt time.Time        `json:"created_at" gorm:"index"`
}

type PostLike struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"uniqueIndex:idx_user_post_like"`
	PostID    uint      `json:"post_id" gorm:"uniqueIndex:idx_user_post_like"`
	CreatedAt time.Time `json:"created_at"`
}

func (CommunityPost) TableName() string {
	return "community_posts"
}

func (PostComment) TableName() string {
	return "post_comments"
}

func (PostLike) TableName() string {
	return "post_likes"
}