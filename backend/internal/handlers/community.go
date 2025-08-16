package handlers

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"log"
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/cache"
	"sikjipsa-backend/pkg/config"
	"sikjipsa-backend/pkg/logger"
	"strconv"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type CommunityHandler struct {
	db    *gorm.DB
	cfg   *config.Config
	cache *cache.RedisCache
}

func NewCommunityHandler(db *gorm.DB, cfg *config.Config, redisCache *cache.RedisCache) *CommunityHandler {
	return &CommunityHandler{db: db, cfg: cfg, cache: redisCache}
}

type CreatePostRequest struct {
	Title    string   `json:"title" validate:"required,noempty,min=1,max=200"`
	Content  string   `json:"content" validate:"required,noempty,min=1,max=5000"`
	Images   []string `json:"images" validate:"max=10,dive,url"`
	PostType string   `json:"post_type" validate:"max=50"`
}

type UpdatePostRequest struct {
	Title         string   `json:"title" validate:"required,noempty,min=1,max=200"`
	Content       string   `json:"content" validate:"required,noempty,min=1,max=5000"`
	PostType      string   `json:"post_type" validate:"max=50"`
	ExistingImages []string `json:"existing_images" validate:"max=10,dive,url"` // 유지할 기존 이미지들
}

func (h *CommunityHandler) GetPosts(c *fiber.Ctx) error {
	logger.Info("Getting posts", 
		"page", c.Query("page", "1"),
		"type", c.Query("type", ""),
		"search", c.Query("search", ""))

	// Generate cache key based on query parameters
	page := c.Query("page", "1")
	postType := c.Query("type", "")
	search := c.Query("search", "")
	limit := c.Query("limit", "20")
	
	cacheKey := h.generateCacheKey("posts", page, postType, search, limit)
	
	// Try to get from cache first
	if h.cache != nil && h.cache.IsAvailable() {
		var cachedResponse fiber.Map
		if err := h.cache.Get(context.Background(), cacheKey, &cachedResponse); err == nil {
			logger.Info("Posts retrieved from cache", "cacheKey", cacheKey)
			return c.JSON(cachedResponse)
		}
	}

	var posts []models.CommunityPost
	var totalCount int64
	
	// Base query with proper joins and exclude deleted posts
	query := h.db.Where("deleted_at IS NULL").Preload("User").Preload("Comments.User")

	// Filter by post type
	if postType != "" && postType != "all" {
		query = query.Where("post_type = ?", postType)
	}

	// Search
	if search != "" {
		query = query.Where("title ILIKE ? OR content ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Get total count for pagination
	countQuery := h.db.Model(&models.CommunityPost{}).Where("deleted_at IS NULL")
	if postType != "" && postType != "all" {
		countQuery = countQuery.Where("post_type = ?", postType)
	}
	if search != "" {
		countQuery = countQuery.Where("title ILIKE ? OR content ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	countQuery.Count(&totalCount)

	// Pagination
	pageInt, _ := strconv.Atoi(page)
	limitInt, _ := strconv.Atoi(limit)
	offset := (pageInt - 1) * limitInt

	// Order by creation date and fetch posts
	if err := query.Order("created_at DESC").Limit(limitInt).Offset(offset).Find(&posts).Error; err != nil {
		logger.Error("Failed to fetch posts from database", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch posts",
		})
	}

	// Calculate pagination metadata
	totalPages := int((totalCount + int64(limitInt) - 1) / int64(limitInt))
	
	response := fiber.Map{
		"posts":        posts,
		"currentPage":  pageInt,
		"totalPages":   totalPages,
		"totalCount":   totalCount,
		"hasMore":      pageInt < totalPages,
	}

	// Cache the response for 5 minutes
	if h.cache != nil && h.cache.IsAvailable() {
		if err := h.cache.Set(context.Background(), cacheKey, response, 5*time.Minute); err != nil {
			logger.Warn("Failed to cache posts response", "error", err)
		} else {
			logger.Info("Posts cached successfully", "cacheKey", cacheKey)
		}
	}

	logger.Info("Posts retrieved successfully", 
		"count", len(posts), 
		"page", pageInt, 
		"totalPages", totalPages)
	return c.JSON(response)
}

func (h *CommunityHandler) CreatePost(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// userID 타입 변환 수정
    var uid uint
    switch v := userID.(type) {
    case float64:
        uid = uint(v)
    case int:
        uid = uint(v)
    case uint:
        uid = v
    default:
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Invalid user ID type",
        })
    }

	// JSON과 Form 데이터 모두 지원
	var title, content, postType string
	
	// Content-Type 확인
	contentType := c.Get("Content-Type")
	if contentType == "application/json" {
		// JSON 형태로 데이터 받기 (onImageUpload 방식)
		var req CreatePostRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request body",
			})
		}
		title = req.Title
		content = req.Content
		postType = req.PostType
	} else {
		// 폼 데이터에서 텍스트 필드 읽기 (기존 방식)
		title = c.FormValue("title")
		content = c.FormValue("content")
		postType = c.FormValue("post_type")
	}

	if title == "" || content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Title and content are required",
		})
	}

	// 기본 post_type 설정
	if postType == "" {
		postType = "general"
	}

	logger.Info("Creating post", "title", title, "postType", postType)

	// JSON 방식인 경우 이미지 업로드 처리 없음 (이미 content에 포함됨)
	// Form 방식인 경우에만 이미지 파일 처리
	var imageUrls []string
	
	if contentType != "application/json" {
		// Cloudinary 설정
		cld, err := cloudinary.NewFromParams(h.cfg.CloudinaryCloudName, h.cfg.CloudinaryAPIKey, h.cfg.CloudinaryAPISecret)
		if err != nil {
			logger.Error("Failed to initialize Cloudinary", "error", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to initialize image upload service",
			})
		}

		// 이미지 파일 처리
		form, err := c.MultipartForm()
		
		if err == nil && form.File["images"] != nil {
			files := form.File["images"]
			logger.Info("Processing image files", "count", len(files))
			
			// Limit to maximum 5 images
			if len(files) > 5 {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Maximum 5 images allowed per post",
				})
			}
			
			for _, file := range files {
				// 파일 검증
				if !isValidImageFile(file) {
					logger.Warn("Invalid image file skipped", "filename", file.Filename)
					continue
				}
				
				// 파일 열기
				src, err := file.Open()
				if err != nil {
					logger.Error("Failed to open image file", "filename", file.Filename, "error", err)
					continue
				}
				defer src.Close()

				// Cloudinary에 업로드
				uploadResult, err := cld.Upload.Upload(context.Background(), src, uploader.UploadParams{
					Folder:         "sikjipsa/community",
					ResourceType:   "image",
					Transformation: "c_limit,w_800,h_800,q_auto:good",
				})
				
				if err != nil {
					logger.Error("Failed to upload image to Cloudinary", "filename", file.Filename, "error", err)
					continue
				}

				imageUrls = append(imageUrls, uploadResult.SecureURL)
				logger.Info("Image uploaded successfully", "url", uploadResult.SecureURL)
			}
		}
	}

	post := models.CommunityPost{
		UserID:   uid,
		Title:    title,
		Content:  content,
		PostType: postType,
	}

	// 이미지 URL들을 JSON으로 저장
	if len(imageUrls) > 0 {
		jsonImages, err := json.Marshal(imageUrls)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to process images",
			})
		}
		post.Images = jsonImages
	}

	if err := h.db.Create(&post).Error; err != nil {
		logger.Error("Failed to create post in database", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create post",
		})
	}

	// Load with user data
	h.db.Preload("User").First(&post, post.ID)

	// Invalidate cache after creating new post
	h.invalidateCommunityCache()

	logger.Info("Post created successfully", "postID", post.ID)
	return c.JSON(post)
}

// UploadImage handles single image upload for onImageUpload
func (h *CommunityHandler) UploadImage(c *fiber.Ctx) error {
	// Check authentication
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}
	
	// Get the image file
	file, err := c.FormFile("image")
	log.Printf("image file received: %v", file)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No image file provided",
		})
	}

	// Validate image file
	if !isValidImageFile(file) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid image file. Only JPG, PNG, GIF are allowed",
		})
	}

	// Open the file
	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to process image file",
		})
	}
	log.Printf("file opened: %v", src)
	defer src.Close()

	// Initialize Cloudinary
	cld, err := cloudinary.NewFromParams(h.cfg.CloudinaryCloudName, h.cfg.CloudinaryAPIKey, h.cfg.CloudinaryAPISecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initialize image upload service",
		})
	}

	// Upload to Cloudinary
	uploadResult, err := cld.Upload.Upload(context.Background(), src, uploader.UploadParams{
		Folder:         "sikjipsa/community/editor",
		ResourceType:   "image",
		Transformation: "c_limit,w_1200,h_1200,q_auto:good",
	})

	if err != nil {
		logger.Error("Failed to upload image to Cloudinary", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to upload image",
		})
	}
	log.Printf("uploadResult: %v", uploadResult.SecureURL)
	// Return the image URL
	return c.JSON(fiber.Map{
		"url": uploadResult.SecureURL,
	})
}

func (h *CommunityHandler) UpdatePost(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// userID 타입 변환
	var uid uint
	switch v := userID.(type) {
	case float64:
		uid = uint(v)
	case int:
		uid = uint(v)
	case uint:
		uid = v
	default:
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID type",
		})
	}

	postID := c.Params("id")

	// 게시글 존재 확인 및 작성자 검증
	var post models.CommunityPost
	if err := h.db.First(&post, postID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Post not found",
		})
	}

	// 작성자 본인 확인
	if post.UserID != uid {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You can only edit your own posts",
		})
	}

	// 폼 데이터에서 텍스트 필드 읽기
	title := c.FormValue("title")
	content := c.FormValue("content")
	postType := c.FormValue("post_type")
	existingImagesStr := c.FormValue("existing_images")

	if title == "" || content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Title and content are required",
		})
	}

	// 기존 이미지 파싱
	var existingImages []string
	if existingImagesStr != "" {
		if err := json.Unmarshal([]byte(existingImagesStr), &existingImages); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid existing images format",
			})
		}
	}

	logger.Info("Updating post", "title", title, "postType", postType)

	// Cloudinary 설정
	cld, err := cloudinary.NewFromParams(h.cfg.CloudinaryCloudName, h.cfg.CloudinaryAPIKey, h.cfg.CloudinaryAPISecret)
	if err != nil {
		logger.Error("Failed to initialize Cloudinary", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initialize image upload service",
		})
	}

	// 새로운 이미지 파일 처리
	form, err := c.MultipartForm()
	var newImageUrls []string
	
	if err == nil && form.File["images"] != nil {
		files := form.File["images"]
		logger.Info("Processing new image files for update", "count", len(files))
		
		// Check total image count (existing + new) doesn't exceed 5
		if len(existingImages)+len(files) > 5 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Maximum 5 images allowed per post",
			})
		}
		
		for _, file := range files {
			// 파일 검증
			if !isValidImageFile(file) {
				logger.Warn("Invalid image file skipped", "filename", file.Filename)
				continue
			}
			
			// 파일 열기
			src, err := file.Open()
			if err != nil {
				logger.Error("Failed to open image file", "filename", file.Filename, "error", err)
				continue
			}
			defer src.Close()

			// Cloudinary에 업로드
			uploadResult, err := cld.Upload.Upload(context.Background(), src, uploader.UploadParams{
				Folder:         "sikjipsa/community",
				ResourceType:   "image",
				Transformation: "c_limit,w_800,h_800,q_auto:good",
			})
			
			if err != nil {
				logger.Error("Failed to upload image to Cloudinary", "filename", file.Filename, "error", err)
				continue
			}

			newImageUrls = append(newImageUrls, uploadResult.SecureURL)
			logger.Info("Image uploaded successfully", "url", uploadResult.SecureURL)
		}
	}

	// 기존 이미지와 새 이미지 합치기
	allImages := append(existingImages, newImageUrls...)

	// 게시글 업데이트
	post.Title = title
	post.Content = content
	if postType != "" {
		post.PostType = postType
	}

	// 이미지 URL들을 JSON으로 저장
	if len(allImages) > 0 {
		jsonImages, err := json.Marshal(allImages)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to process images",
			})
		}
		post.Images = jsonImages
	} else {
		post.Images = nil
	}

	if err := h.db.Save(&post).Error; err != nil {
		logger.Error("Failed to update post in database", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update post",
		})
	}

	// Load with user data
	h.db.Preload("User").First(&post, post.ID)

	// Invalidate cache after updating post
	h.invalidateCommunityCache()

	logger.Info("Post updated successfully", "postID", post.ID)
	return c.JSON(post)
}


func (h *CommunityHandler) DeletePost(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// userID 타입 변환
	var uid uint
	switch v := userID.(type) {
	case float64:
		uid = uint(v)
	case int:
		uid = uint(v)
	case uint:
		uid = v
	default:
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID type",
		})
	}

	postID := c.Params("id")

	// 게시글 존재 확인 및 작성자 검증
	var post models.CommunityPost
	if err := h.db.First(&post, postID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Post not found",
		})
	}

	// 작성자 본인 확인
	if post.UserID != uid {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You can only delete your own posts",
		})
	}

	// 관련 데이터 삭제 (좋아요, 댓글)
	// 좋아요 삭제
	h.db.Where("post_id = ?", postID).Delete(&models.PostLike{})
	
	// 댓글 삭제 (답글 포함)
	h.db.Where("post_id = ?", postID).Delete(&models.PostComment{})

	// 게시글 삭제
	if err := h.db.Delete(&post).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete post",
		})
	}

	// Invalidate cache after deleting post
	h.invalidateCommunityCache()

	return c.JSON(fiber.Map{
		"message": "Post deleted successfully",
	})
}

func (h *CommunityHandler) GetPost(c *fiber.Ctx) error {
	id := c.Params("id")
	var post models.CommunityPost

	if err := h.db.Preload("User").Preload("Comments", "parent_id IS NULL").Preload("Comments.User").Preload("Comments.Replies.User").First(&post, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Post not found",
		})
	}

	// Check if current user has liked this post
	userID := c.Locals("userID")
	isLiked := false
	if userID != nil {
		var uid uint
		switch v := userID.(type) {
		case float64:
			uid = uint(v)
		case int:
			uid = uint(v)
		case uint:
			uid = v
		}

		var existingLike models.PostLike
		if err := h.db.Where("user_id = ? AND post_id = ?", uid, id).First(&existingLike).Error; err == nil {
			isLiked = true
		}
	}

	// Create response with like status
	response := struct {
		models.CommunityPost
		IsLikedByUser bool `json:"is_liked_by_user"`
	}{
		CommunityPost: post,
		IsLikedByUser: isLiked,
	}

	return c.JSON(response)
}

func (h *CommunityHandler) LikePost(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var uid uint
    switch v := userID.(type) {
    case float64:
        uid = uint(v)
    case int:
        uid = uint(v)
    case uint:
        uid = v
    default:
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Invalid user ID type",
        })
    }

	postID := c.Params("id")

	// Check if already liked
	var existingLike models.PostLike
	if err := h.db.Where("user_id = ? AND post_id = ?", uid, postID).First(&existingLike).Error; err == nil {
		// Unlike
		h.db.Delete(&existingLike)
		h.db.Model(&models.CommunityPost{}).Where("id = ?", postID).
			Update("likes_count", gorm.Expr("likes_count - 1"))
		
		return c.JSON(fiber.Map{
			"message": "Post unliked",
			"liked":   false,
		})
	}

	// Like
	like := models.PostLike{
		UserID: uid,
		PostID: uint(mustParseUint(postID)),
	}

	if err := h.db.Create(&like).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to like post",
		})
	}

	// Update likes count
	h.db.Model(&models.CommunityPost{}).Where("id = ?", postID).
		Update("likes_count", gorm.Expr("likes_count + 1"))

	return c.JSON(fiber.Map{
		"message": "Post liked",
		"liked":   true,
	})
}

type AddCommentRequest struct {
	Content  string `json:"content"`
	ParentID *uint  `json:"parent_id,omitempty"`
}

type UpdateCommentRequest struct {
	Content string `json:"content"`
}

func (h *CommunityHandler) AddComment(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}
	// userID 타입 변환
    var uid uint
    switch v := userID.(type) {
    case float64:
        uid = uint(v)
    case int:
        uid = uint(v)
    case uint:
        uid = v
    default:
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Invalid user ID type",
        })
    }

	postID := c.Params("id")
	
	var req AddCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	comment := models.PostComment{
		PostID:   uint(mustParseUint(postID)),
		UserID:   uid,
		Content:  req.Content,
		ParentID: req.ParentID,
	}

	if err := h.db.Create(&comment).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add comment",
		})
	}

	// Load with user data
	h.db.Preload("User").First(&comment, comment.ID)

	// Invalidate cache after adding comment
	h.invalidateCommunityCache()

	return c.JSON(comment)
}

func (h *CommunityHandler) UpdateComment(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// userID 타입 변환
	var uid uint
	switch v := userID.(type) {
	case float64:
		uid = uint(v)
	case int:
		uid = uint(v)
	case uint:
		uid = v
	default:
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID type",
		})
	}

	postID := c.Params("id")
	commentID := c.Params("commentId")
	
	var req UpdateCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Content is required",
		})
	}

	// 댓글 존재 확인 및 작성자 검증
	var comment models.PostComment
	if err := h.db.Where("id = ? AND post_id = ?", commentID, postID).First(&comment).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Comment not found",
		})
	}

	// 작성자 본인 확인
	if comment.UserID != uid {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You can only edit your own comments",
		})
	}

	// 댓글 내용 업데이트
	comment.Content = req.Content
	if err := h.db.Save(&comment).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update comment",
		})
	}

	// Load with user data
	h.db.Preload("User").First(&comment, comment.ID)

	return c.JSON(comment)
}

func (h *CommunityHandler) DeleteComment(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// userID 타입 변환
	var uid uint
	switch v := userID.(type) {
	case float64:
		uid = uint(v)
	case int:
		uid = uint(v)
	case uint:
		uid = v
	default:
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID type",
		})
	}

	postID := c.Params("id")
	commentID := c.Params("commentId")

	// 댓글 존재 확인 및 작성자 검증
	var comment models.PostComment
	if err := h.db.Where("id = ? AND post_id = ?", commentID, postID).First(&comment).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Comment not found",
		})
	}

	// 작성자 본인 확인
	if comment.UserID != uid {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You can only delete your own comments",
		})
	}

	// 답글이 있는지 확인
	var replyCount int64
	h.db.Model(&models.PostComment{}).Where("parent_id = ?", commentID).Count(&replyCount)

	if replyCount > 0 {
		// 답글이 있으면 삭제 표시만 하고 댓글은 유지
		comment.Content = "삭제된 댓글입니다."
		comment.IsDeleted = true
		if err := h.db.Save(&comment).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to mark comment as deleted",
			})
		}
	} else {
		// 답글이 없으면 완전히 삭제
		if err := h.db.Delete(&comment).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to delete comment",
			})
		}
	}

	return c.JSON(fiber.Map{
		"message": "Comment deleted successfully",
	})
}

func (h *CommunityHandler) generateCacheKey(prefix string, params ...string) string {
	key := fmt.Sprintf("community:%s", prefix)
	for _, param := range params {
		if param != "" {
			hasher := md5.New()
			hasher.Write([]byte(param))
			key += ":" + fmt.Sprintf("%x", hasher.Sum(nil))[:8]
		}
	}
	return key
}

func (h *CommunityHandler) invalidateCommunityCache() {
	if h.cache != nil && h.cache.IsAvailable() {
		if err := h.cache.DeletePattern(context.Background(), "community:posts*"); err != nil {
			logger.Warn("Failed to invalidate community cache", "error", err)
		} else {
			logger.Info("Community cache invalidated successfully")
		}
	}
}

func mustParseUint(s string) uint64 {
	val, _ := strconv.ParseUint(s, 10, 32)
	return val
}