package handlers

import (
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/config"
	"strconv"
	"encoding/json"
	"fmt"
	"context"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CommunityHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewCommunityHandler(db *gorm.DB, cfg *config.Config) *CommunityHandler {
	return &CommunityHandler{db: db, cfg: cfg}
}

type CreatePostRequest struct {
	Title    string   `json:"title"`
	Content  string   `json:"content"`
	Images   []string `json:"images"`
	PostType string   `json:"post_type"`
}

type UpdatePostRequest struct {
	Title         string   `json:"title"`
	Content       string   `json:"content"`
	PostType      string   `json:"post_type"`
	ExistingImages []string `json:"existing_images"` // 유지할 기존 이미지들
}

func (h *CommunityHandler) GetPosts(c *fiber.Ctx) error {
	fmt.Printf("GetPosts called with params: page=%s, type=%s, search=%s\n", 
		c.Query("page", "1"), c.Query("type", ""), c.Query("search", ""))

	var posts []models.CommunityPost
	var totalCount int64
	
	// Base query with proper joins and exclude deleted posts
	query := h.db.Where("deleted_at IS NULL").Preload("User").Preload("Comments.User")

	// Filter by post type
	if postType := c.Query("type"); postType != "" && postType != "all" {
		query = query.Where("post_type = ?", postType)
	}

	// Search
	if search := c.Query("search"); search != "" {
		query = query.Where("title ILIKE ? OR content ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Get total count for pagination
	countQuery := h.db.Model(&models.CommunityPost{}).Where("deleted_at IS NULL")
	if postType := c.Query("type"); postType != "" && postType != "all" {
		countQuery = countQuery.Where("post_type = ?", postType)
	}
	if search := c.Query("search"); search != "" {
		countQuery = countQuery.Where("title ILIKE ? OR content ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	countQuery.Count(&totalCount)

	// Pagination
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset := (page - 1) * limit

	// Order by creation date and fetch posts
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&posts).Error; err != nil {
		fmt.Printf("Database error in GetPosts: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch posts",
		})
	}

	// Calculate pagination metadata
	totalPages := int((totalCount + int64(limit) - 1) / int64(limit))
	
	response := fiber.Map{
		"posts":        posts,
		"currentPage":  page,
		"totalPages":   totalPages,
		"totalCount":   totalCount,
		"hasMore":      page < totalPages,
	}

	fmt.Printf("GetPosts response: found %d posts, page %d/%d\n", len(posts), page, totalPages)
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

	// 폼 데이터에서 텍스트 필드 읽기
	title := c.FormValue("title")
	content := c.FormValue("content")
	postType := c.FormValue("post_type")

	if title == "" || content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Title and content are required",
		})
	}

	// 기본 post_type 설정
	if postType == "" {
		postType = "general"
	}

	fmt.Printf("Creating post - Title: %s, Content: %s, PostType: %s\n", title, content, postType)

	// Cloudinary 설정
	cld, err := cloudinary.NewFromParams(h.cfg.CloudinaryCloudName, h.cfg.CloudinaryAPIKey, h.cfg.CloudinaryAPISecret)
	if err != nil {
		fmt.Printf("Cloudinary initialization error: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initialize image upload service",
		})
	}

	// 이미지 파일 처리
	form, err := c.MultipartForm()
	var imageUrls []string
	
	if err == nil && form.File["images"] != nil {
		files := form.File["images"]
		fmt.Printf("Found %d image files\n", len(files))
		
		for _, file := range files {
			// 파일 검증
			if !isValidImageFile(file) {
				fmt.Printf("Invalid file: %s\n", file.Filename)
				continue
			}
			
			// 파일 열기
			src, err := file.Open()
			if err != nil {
				fmt.Printf("Error opening file %s: %v\n", file.Filename, err)
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
				fmt.Printf("Error uploading to Cloudinary: %v\n", err)
				continue
			}

			imageUrls = append(imageUrls, uploadResult.SecureURL)
			fmt.Printf("Successfully uploaded: %s\n", uploadResult.SecureURL)
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
		fmt.Printf("Database error: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create post",
		})
	}

	// Load with user data
	h.db.Preload("User").First(&post, post.ID)

	fmt.Printf("Post created successfully with ID: %d\n", post.ID)
	return c.JSON(post)
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

	fmt.Printf("Updating post - Title: %s, Content: %s, PostType: %s\n", title, content, postType)

	// Cloudinary 설정
	cld, err := cloudinary.NewFromParams(h.cfg.CloudinaryCloudName, h.cfg.CloudinaryAPIKey, h.cfg.CloudinaryAPISecret)
	if err != nil {
		fmt.Printf("Cloudinary initialization error: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initialize image upload service",
		})
	}

	// 새로운 이미지 파일 처리
	form, err := c.MultipartForm()
	var newImageUrls []string
	
	if err == nil && form.File["images"] != nil {
		files := form.File["images"]
		fmt.Printf("Found %d new image files\n", len(files))
		
		for _, file := range files {
			// 파일 검증
			if !isValidImageFile(file) {
				fmt.Printf("Invalid file: %s\n", file.Filename)
				continue
			}
			
			// 파일 열기
			src, err := file.Open()
			if err != nil {
				fmt.Printf("Error opening file %s: %v\n", file.Filename, err)
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
				fmt.Printf("Error uploading to Cloudinary: %v\n", err)
				continue
			}

			newImageUrls = append(newImageUrls, uploadResult.SecureURL)
			fmt.Printf("Successfully uploaded: %s\n", uploadResult.SecureURL)
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
		fmt.Printf("Database error: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update post",
		})
	}

	// Load with user data
	h.db.Preload("User").First(&post, post.ID)

	fmt.Printf("Post updated successfully with ID: %d\n", post.ID)
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

func mustParseUint(s string) uint64 {
	val, _ := strconv.ParseUint(s, 10, 32)
	return val
}