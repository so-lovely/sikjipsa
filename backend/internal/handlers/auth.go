package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sikjipsa-backend/internal/errors"
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/config"
	"sikjipsa-backend/pkg/logger"
	"sikjipsa-backend/pkg/utils"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	handler := &AuthHandler{db: db, cfg: cfg}
	
	// Validate social login configuration
	if err := handler.validateSocialLoginConfig(); err != nil {
		logger.Warn("Social login configuration validation failed: ", err)
	}
	
	return handler
}

// Removed RegisterRequest and LoginRequest structs as we only support social login

// Social login configuration validation
func (h *AuthHandler) validateSocialLoginConfig() error {
	var validationErrors []string
	
	if h.cfg.NaverClientID == "" {
		validationErrors = append(validationErrors, "NAVER_CLIENT_ID not configured")
	}
	if h.cfg.NaverClientSecret == "" {
		validationErrors = append(validationErrors, "NAVER_CLIENT_SECRET not configured")
	}
	if h.cfg.KakaoClientID == "" {
		validationErrors = append(validationErrors, "KAKAO_CLIENT_ID not configured")
	}
	if h.cfg.KakaoClientSecret == "" {
		validationErrors = append(validationErrors, "KAKAO_CLIENT_SECRET not configured")
	}
	
	if len(validationErrors) > 0 {
		return fmt.Errorf("social login configuration errors: %s", strings.Join(validationErrors, ", "))
	}
	
	return nil
}

type SocialLoginRequest struct {
	Code         string `json:"code" validate:"required,noempty,min=1,max=500"`
	State        string `json:"state,omitempty" validate:"max=100"`
	RedirectURI  string `json:"redirect_uri" validate:"required,url,max=500"`
}

type NaverTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    string `json:"expires_in"`
}

type NaverUserResponse struct {
	ResultCode string `json:"resultcode"`
	Message    string `json:"message"`
	Response   struct {
		ID       string `json:"id"`
		Email    string `json:"email"`
		Name     string `json:"name"`
		Nickname string `json:"nickname"`
		Profile  string `json:"profile_image"`
	} `json:"response"`
}

type KakaoTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
}

type KakaoUserResponse struct {
	ID         int64 `json:"id"`
	Properties struct {
		Nickname       string `json:"nickname"`
		ProfileImage   string `json:"profile_image"`
		ThumbnailImage string `json:"thumbnail_image"`
	} `json:"properties"`
	KakaoAccount struct {
		Email string `json:"email"`
	} `json:"kakao_account"`
}

// Register and Login functions removed - only social login supported

// Token exchange helper functions

// exchangeNaverToken exchanges authorization code for access token
func (h *AuthHandler) exchangeNaverToken(code, state string) (*NaverTokenResponse, error) {
	if h.cfg.NaverClientID == "" || h.cfg.NaverClientSecret == "" {
		return nil, errors.NewAPIError(errors.ErrCodeInternal, "Naver client credentials not configured", 500)
	}

	tokenURL := "https://nid.naver.com/oauth2.0/token"
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", h.cfg.NaverClientID)
	data.Set("client_secret", h.cfg.NaverClientSecret)
	data.Set("code", code)
	data.Set("state", state)

	resp, err := http.PostForm(tokenURL, data)
	if err != nil {
		logger.Error("Failed to call Naver token API: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to get access token from Naver", 500)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Error("Failed to read Naver token response: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to read response from Naver", 500)
	}

	if resp.StatusCode != 200 {
		logger.WithFields(logrus.Fields{
			"status_code": resp.StatusCode,
			"response": string(body),
		}).Error("Naver token API returned error")
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, fmt.Sprintf("Naver API error: %s", string(body)), 500)
	}

	var tokenResp NaverTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		logger.Error("Failed to parse Naver token response: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to parse token response from Naver", 500)
	}

	if tokenResp.AccessToken == "" {
		logger.Error("Received empty access token from Naver")
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Access token is empty", 500)
	}

	return &tokenResp, nil
}

// exchangeKakaoToken exchanges authorization code for access token
func (h *AuthHandler) exchangeKakaoToken(code, redirectURI string) (*KakaoTokenResponse, error) {
	if h.cfg.KakaoClientID == "" || h.cfg.KakaoClientSecret == "" {
		return nil, errors.NewAPIError(errors.ErrCodeInternal, "Kakao client credentials not configured", 500)
	}

	tokenURL := "https://kauth.kakao.com/oauth/token"
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", h.cfg.KakaoClientID)
	data.Set("client_secret", h.cfg.KakaoClientSecret)
	data.Set("code", code)
	data.Set("redirect_uri", redirectURI)

	resp, err := http.PostForm(tokenURL, data)
	if err != nil {
		logger.Error("Failed to call Kakao token API: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to get access token from Kakao", 500)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Error("Failed to read Kakao token response: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to read response from Kakao", 500)
	}

	if resp.StatusCode != 200 {
		logger.WithFields(logrus.Fields{
			"status_code": resp.StatusCode,
			"response": string(body),
		}).Error("Kakao token API returned error")
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, fmt.Sprintf("Kakao API error: %s", string(body)), 500)
	}

	var tokenResp KakaoTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		logger.Error("Failed to parse Kakao token response: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to parse token response from Kakao", 500)
	}

	if tokenResp.AccessToken == "" {
		logger.Error("Received empty access token from Kakao")
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Access token is empty", 500)
	}

	return &tokenResp, nil
}

// User info retrieval helper functions

// getNaverUserInfo retrieves user information using access token
func (h *AuthHandler) getNaverUserInfo(accessToken string) (*NaverUserResponse, error) {
	userInfoURL := "https://openapi.naver.com/v1/nid/me"
	req, err := http.NewRequest("GET", userInfoURL, nil)
	if err != nil {
		logger.Error("Failed to create Naver user info request: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to create request for user info", 500)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		logger.Error("Failed to call Naver user info API: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to get user info from Naver", 500)
	}
	defer resp.Body.Close()

	userBody, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Error("Failed to read Naver user info response: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to read user info response from Naver", 500)
	}

	if resp.StatusCode != 200 {
		logger.WithFields(logrus.Fields{
			"status_code": resp.StatusCode,
			"response": string(userBody),
		}).Error("Naver user info API returned error")
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, fmt.Sprintf("Naver user info API error: %s", string(userBody)), 500)
	}

	var userResp NaverUserResponse
	if err := json.Unmarshal(userBody, &userResp); err != nil {
		logger.Error("Failed to parse Naver user info: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to parse user info from Naver", 500)
	}

	return &userResp, nil
}

// getKakaoUserInfo retrieves user information using access token
func (h *AuthHandler) getKakaoUserInfo(accessToken string) (*KakaoUserResponse, error) {
	userInfoURL := "https://kapi.kakao.com/v2/user/me"
	req, err := http.NewRequest("GET", userInfoURL, nil)
	if err != nil {
		logger.Error("Failed to create Kakao user info request: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to create request for user info", 500)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		logger.Error("Failed to call Kakao user info API: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to get user info from Kakao", 500)
	}
	defer resp.Body.Close()

	userBody, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Error("Failed to read Kakao user info response: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to read user info response from Kakao", 500)
	}

	if resp.StatusCode != 200 {
		logger.WithFields(logrus.Fields{
			"status_code": resp.StatusCode,
			"response": string(userBody),
		}).Error("Kakao user info API returned error")
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, fmt.Sprintf("Kakao user info API error: %s", string(userBody)), 500)
	}

	var userResp KakaoUserResponse
	if err := json.Unmarshal(userBody, &userResp); err != nil {
		logger.Error("Failed to parse Kakao user info: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeExternalAPI, "Failed to parse user info from Kakao", 500)
	}

	return &userResp, nil
}

// User management helper functions

// SocialUserInfo represents normalized social user information
type SocialUserInfo struct {
	Provider     string
	SocialID     string
	Email        string
	Username     string
	ProfileImage string
}

// findOrCreateUser finds existing user or creates new one for social login
func (h *AuthHandler) findOrCreateUser(socialInfo SocialUserInfo) (*models.User, error) {
	var user models.User
	
	// First try to find user by social provider and ID
	err := h.db.Where("social_provider = ? AND social_id = ?", socialInfo.Provider, socialInfo.SocialID).First(&user).Error
	
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Try to find by email and link account if exists
			if socialInfo.Email != "" {
				var existingUser models.User
				if err := h.db.Where("email = ?", socialInfo.Email).First(&existingUser).Error; err == nil {
					// Link social account to existing user
					return h.linkSocialAccount(&existingUser, socialInfo)
				}
			}
			
			// Create new user
			return h.createNewUser(socialInfo)
		}
		
		// Database error
		logger.Error("Database error during social login: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeDatabaseError, "Database error during user lookup", 500)
	}
	
	// Existing user found
	logger.WithFields(logrus.Fields{
		"provider": socialInfo.Provider,
		"user_id": user.ID,
	}).Info("Existing user logged in")
	
	return &user, nil
}

// linkSocialAccount links social account to existing user
func (h *AuthHandler) linkSocialAccount(existingUser *models.User, socialInfo SocialUserInfo) (*models.User, error) {
	existingUser.SocialProvider = socialInfo.Provider
	existingUser.SocialID = socialInfo.SocialID
	if socialInfo.ProfileImage != "" {
		existingUser.ProfileImage = socialInfo.ProfileImage
	}
	
	if err := h.db.Save(existingUser).Error; err != nil {
		logger.WithFields(logrus.Fields{
			"provider": socialInfo.Provider,
			"email": socialInfo.Email,
		}).Error("Failed to link social account: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeDatabaseError, "Failed to link social account", 500)
	}
	
	logger.WithFields(logrus.Fields{
		"provider": socialInfo.Provider,
		"user_id": existingUser.ID,
	}).Info("Social account linked to existing user")
	
	return existingUser, nil
}

// createNewUser creates a new user for social login
func (h *AuthHandler) createNewUser(socialInfo SocialUserInfo) (*models.User, error) {
	email := socialInfo.Email
	if email == "" {
		// Fallback email for providers that don't provide email
		email = fmt.Sprintf("%s_%s@%s.social", socialInfo.Provider, socialInfo.SocialID, socialInfo.Provider)
		logger.WithField("provider", socialInfo.Provider).Warn("Using fallback email for social login")
	}
	
	username := socialInfo.Username
	if username == "" {
		username = "닉네임 없음"
	}
	
	user := models.User{
		Email:          email,
		Username:       username,
		Role:           "user",
		ProfileImage:   socialInfo.ProfileImage,
		SocialProvider: socialInfo.Provider,
		SocialID:       socialInfo.SocialID,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	
	if err := h.db.Create(&user).Error; err != nil {
		logger.WithFields(logrus.Fields{
			"provider": socialInfo.Provider,
			"email": email,
		}).Error("Failed to create new user: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeDatabaseError, "Failed to create user", 500)
	}
	
	logger.WithFields(logrus.Fields{
		"provider": socialInfo.Provider,
		"user_id": user.ID,
	}).Info("New user created")
	
	return &user, nil
}

// generateTokenResponse generates JWT tokens and response
func (h *AuthHandler) generateTokenResponse(user *models.User, provider string) (fiber.Map, error) {
	// Generate access and refresh tokens
	accessToken, err := utils.GenerateJWT(user.ID, user.Email, h.cfg.JWTSecret)
	if err != nil {
		logger.Error("Failed to generate access token: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeInternal, "Failed to generate access token", 500)
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID, h.cfg.JWTSecret)
	if err != nil {
		logger.WithField("user_id", user.ID).Error("Failed to generate refresh token: ", err)
		return nil, errors.NewAPIError(errors.ErrCodeInternal, "Failed to generate refresh token", 500)
	}

	// Capitalize first letter of provider name
	providerName := strings.Title(provider)
	
	return fiber.Map{
		"user":         user,
		"access_token": accessToken,
		"refresh_token": refreshToken,
		"token_type":   "Bearer",
		"expires_in":   3600, // 1 hour in seconds
		"message":      fmt.Sprintf("%s 로그인 성공", providerName),
	}, nil
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return errors.HandleError(c, errors.ErrUnauthorized)
	}

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.HandleError(c, errors.NewNotFoundError("User"))
		}
		return errors.HandleError(c, errors.ErrDatabaseError)
	}

	return c.JSON(user)
}

type UpdateProfileRequest struct {
	Username string `json:"username" validate:"required,min=2,max=50"`
}

func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return errors.HandleError(c, errors.ErrUnauthorized)
	}

	var req UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.HandleError(c, errors.NewValidationError("Invalid request body"))
	}

	// 현재 사용자 조회
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.HandleError(c, errors.NewNotFoundError("User"))
		}
		return errors.HandleError(c, errors.ErrDatabaseError)
	}

	// 닉네임 중복 확인 (자신 제외) - 기본 닉네임은 중복 허용
	if req.Username != "닉네임 없음" {
		var existingUser models.User
		if err := h.db.Where("username = ? AND id != ?", req.Username, userID).First(&existingUser).Error; err == nil {
			return errors.HandleError(c, errors.NewConflictError("Username already exists"))
		}
	}

	// 프로필 업데이트 (닉네임만)
	user.Username = req.Username

	if err := h.db.Save(&user).Error; err != nil {
		return errors.HandleError(c, errors.ErrDatabaseError)
	}

	return c.JSON(fiber.Map{
		"message": "Profile updated successfully",
		"user":    user,
	})
}

func (h *AuthHandler) DeleteAccount(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return errors.HandleError(c, errors.ErrUnauthorized)
	}

	// 현재 사용자 조회
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.HandleError(c, errors.NewNotFoundError("User"))
		}
		return errors.HandleError(c, errors.ErrDatabaseError)
	}

	var deletionErrors []string

	// 외래키 관계를 고려한 순차적 하드 삭제 (자식부터 부모 순서로)
	
	// 1. 게시글 좋아요 하드 삭제 (가장 하위 자식)
	if err := h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.PostLike{}).Error; err != nil {
		logger.WithField("user_id", userID).Error("Failed to delete post likes: ", err)
		deletionErrors = append(deletionErrors, fmt.Sprintf("Failed to delete post likes: %v", err))
	}

	// 2. 게시글 댓글 하드 삭제 (답글부터 먼저 삭제)
	// 2-1. 답글(자식 댓글) 먼저 삭제
	if err := h.db.Unscoped().Where("user_id = ? AND parent_id IS NOT NULL", userID).Delete(&models.PostComment{}).Error; err != nil {
		logger.WithField("user_id", userID).Error("Failed to delete comment replies: ", err)
		deletionErrors = append(deletionErrors, fmt.Sprintf("Failed to delete comment replies: %v", err))
	}
	// 2-2. 부모 댓글 삭제
	if err := h.db.Unscoped().Where("user_id = ? AND parent_id IS NULL", userID).Delete(&models.PostComment{}).Error; err != nil {
		logger.WithField("user_id", userID).Error("Failed to delete parent comments: ", err)
		deletionErrors = append(deletionErrors, fmt.Sprintf("Failed to delete parent comments: %v", err))
	}

	// 3. 다이어리 엔트리 하드 삭제 (다이어리의 자식)
	// 사용자의 모든 다이어리 ID를 먼저 가져와서 해당 엔트리들 삭제
	var diaryIDs []uint
	h.db.Model(&models.GrowthDiary{}).Where("user_id = ?", userID).Pluck("id", &diaryIDs)
	if len(diaryIDs) > 0 {
		if err := h.db.Unscoped().Where("diary_id IN ?", diaryIDs).Delete(&models.DiaryEntry{}).Error; err != nil {
			logger.WithField("user_id", userID).Error("Failed to delete diary entries: ", err)
			deletionErrors = append(deletionErrors, fmt.Sprintf("Failed to delete diary entries: %v", err))
		}
	}

	// 4. 사용자의 게시글들 하드 삭제
	if err := h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.CommunityPost{}).Error; err != nil {
		logger.WithField("user_id", userID).Error("Failed to delete posts: ", err)
		deletionErrors = append(deletionErrors, fmt.Sprintf("Failed to delete posts: %v", err))
	}

	// 5. 사용자의 다이어리 하드 삭제
	if err := h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.GrowthDiary{}).Error; err != nil {
		logger.WithField("user_id", userID).Error("Failed to delete diaries: ", err)
		deletionErrors = append(deletionErrors, fmt.Sprintf("Failed to delete diaries: %v", err))
	}

	// 6. 사용자의 진단 기록 하드 삭제
	if err := h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.DiagnosisRequest{}).Error; err != nil {
		logger.WithField("user_id", userID).Error("Failed to delete diagnosis records: ", err)
		deletionErrors = append(deletionErrors, fmt.Sprintf("Failed to delete diagnosis records: %v", err))
	}

	// 7. 사용자 계정 하드 삭제 (가장 마지막, 가장 중요한 부분)
	if err := h.db.Unscoped().Delete(&user).Error; err != nil {
		// 계정 삭제 실패는 치명적이므로 에러 반환
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete user account",
			"partial_errors": deletionErrors,
		})
	}

	// 계정은 삭제되었지만 일부 데이터 삭제에서 오류가 있었던 경우
	if len(deletionErrors) > 0 {
		return c.JSON(fiber.Map{
			"message": "Account deleted successfully, but some data deletion failed",
			"warnings": deletionErrors,
		})
	}

	return c.JSON(fiber.Map{
		"message": "Account deleted successfully",
	})
}

func (h *AuthHandler) NaverLogin(c *fiber.Ctx) error {
	var req SocialLoginRequest
	if err := c.BodyParser(&req); err != nil {
		logger.Error("Failed to parse Naver login request: ", err)
		return errors.HandleError(c, errors.NewValidationError("Invalid request body"))
	}

	// 1. Exchange authorization code for access token
	tokenResp, err := h.exchangeNaverToken(req.Code, req.State)
	if err != nil {
		return errors.HandleError(c, err)
	}

	// 2. Get user information using access token
	userResp, err := h.getNaverUserInfo(tokenResp.AccessToken)
	if err != nil {
		return errors.HandleError(c, err)
	}

	// 3. Normalize user information
	username := userResp.Response.Nickname
	if username == "" {
		username = userResp.Response.Name
	}
	if username == "" {
		username = "닉네임 없음"
	}

	socialInfo := SocialUserInfo{
		Provider:     "naver",
		SocialID:     userResp.Response.ID,
		Email:        userResp.Response.Email,
		Username:     username,
		ProfileImage: userResp.Response.Profile,
	}

	// 4. Find or create user
	user, err := h.findOrCreateUser(socialInfo)
	if err != nil {
		return errors.HandleError(c, err)
	}

	// 5. Generate token response
	response, err := h.generateTokenResponse(user, "naver")
	if err != nil {
		return errors.HandleError(c, err)
	}

	logger.WithField("provider", "naver").Info("Naver login successful")
	return c.JSON(response)
}

// KakaoLogin handles Kakao social login
func (h *AuthHandler) KakaoLogin(c *fiber.Ctx) error {
	var req SocialLoginRequest
	if err := c.BodyParser(&req); err != nil {
		logger.Error("Failed to parse Kakao login request: ", err)
		return errors.HandleError(c, errors.NewValidationError("Invalid request body"))
	}

	// 1. Exchange authorization code for access token
	tokenResp, err := h.exchangeKakaoToken(req.Code, req.RedirectURI)
	if err != nil {
		return errors.HandleError(c, err)
	}

	// 2. Get user information using access token
	userResp, err := h.getKakaoUserInfo(tokenResp.AccessToken)
	if err != nil {
		return errors.HandleError(c, err)
	}

	// 3. Normalize user information
	username := userResp.Properties.Nickname
	if username == "" {
		username = "닉네임 없음"
	}

	socialInfo := SocialUserInfo{
		Provider:     "kakao",
		SocialID:     fmt.Sprintf("%d", userResp.ID),
		Email:        userResp.KakaoAccount.Email,
		Username:     username,
		ProfileImage: userResp.Properties.ProfileImage,
	}

	// 4. Find or create user
	user, err := h.findOrCreateUser(socialInfo)
	if err != nil {
		return errors.HandleError(c, err)
	}

	// 5. Generate token response
	response, err := h.generateTokenResponse(user, "kakao")
	if err != nil {
		return errors.HandleError(c, err)
	}

	logger.WithField("provider", "kakao").Info("Kakao login successful")
	return c.JSON(response)
}

