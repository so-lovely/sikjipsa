package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sikjipsa-backend/internal/models"
	"sikjipsa-backend/pkg/config"
	"sikjipsa-backend/pkg/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg}
}

// Removed RegisterRequest and LoginRequest structs as we only support social login

type SocialLoginRequest struct {
	Code         string `json:"code" validate:"required"`
	State        string `json:"state,omitempty"`
	RedirectURI  string `json:"redirect_uri" validate:"required"`
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

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	return c.JSON(user)
}

type UpdateProfileRequest struct {
	Username string `json:"username" validate:"required,min=2,max=50"`
}

func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var req UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// 현재 사용자 조회
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	// 닉네임 중복 확인 (자신 제외) - 기본 닉네임은 중복 허용
	if req.Username != "닉네임 없음" {
		var existingUser models.User
		if err := h.db.Where("username = ? AND id != ?", req.Username, userID).First(&existingUser).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Username already exists",
			})
		}
	}

	// 프로필 업데이트 (닉네임만)
	user.Username = req.Username

	if err := h.db.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update profile",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Profile updated successfully",
		"user":    user,
	})
}

func (h *AuthHandler) DeleteAccount(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// 현재 사용자 조회
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	var errors []string

	// 외래키 관계를 고려한 순차적 하드 삭제 (자식부터 부모 순서로)
	
	// 1. 게시글 좋아요 하드 삭제 (가장 하위 자식)
	if err := h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.PostLike{}).Error; err != nil {
		errors = append(errors, fmt.Sprintf("Failed to delete post likes: %v", err))
	}

	// 2. 게시글 댓글 하드 삭제 (답글부터 먼저 삭제)
	// 2-1. 답글(자식 댓글) 먼저 삭제
	if err := h.db.Unscoped().Where("user_id = ? AND parent_id IS NOT NULL", userID).Delete(&models.PostComment{}).Error; err != nil {
		errors = append(errors, fmt.Sprintf("Failed to delete comment replies: %v", err))
	}
	// 2-2. 부모 댓글 삭제
	if err := h.db.Unscoped().Where("user_id = ? AND parent_id IS NULL", userID).Delete(&models.PostComment{}).Error; err != nil {
		errors = append(errors, fmt.Sprintf("Failed to delete parent comments: %v", err))
	}

	// 3. 다이어리 엔트리 하드 삭제 (다이어리의 자식)
	// 사용자의 모든 다이어리 ID를 먼저 가져와서 해당 엔트리들 삭제
	var diaryIDs []uint
	h.db.Model(&models.GrowthDiary{}).Where("user_id = ?", userID).Pluck("id", &diaryIDs)
	if len(diaryIDs) > 0 {
		if err := h.db.Unscoped().Where("diary_id IN ?", diaryIDs).Delete(&models.DiaryEntry{}).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Failed to delete diary entries: %v", err))
		}
	}

	// 4. 사용자의 게시글들 하드 삭제
	if err := h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.CommunityPost{}).Error; err != nil {
		errors = append(errors, fmt.Sprintf("Failed to delete posts: %v", err))
	}

	// 5. 사용자의 다이어리 하드 삭제
	if err := h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.GrowthDiary{}).Error; err != nil {
		errors = append(errors, fmt.Sprintf("Failed to delete diaries: %v", err))
	}

	// 6. 사용자의 진단 기록 하드 삭제
	if err := h.db.Unscoped().Where("user_id = ?", userID).Delete(&models.DiagnosisRequest{}).Error; err != nil {
		errors = append(errors, fmt.Sprintf("Failed to delete diagnosis records: %v", err))
	}

	// 7. 사용자 계정 하드 삭제 (가장 마지막, 가장 중요한 부분)
	if err := h.db.Unscoped().Delete(&user).Error; err != nil {
		// 계정 삭제 실패는 치명적이므로 에러 반환
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete user account",
			"partial_errors": errors,
		})
	}

	// 계정은 삭제되었지만 일부 데이터 삭제에서 오류가 있었던 경우
	if len(errors) > 0 {
		return c.JSON(fiber.Map{
			"message": "Account deleted successfully, but some data deletion failed",
			"warnings": errors,
		})
	}

	return c.JSON(fiber.Map{
		"message": "Account deleted successfully",
	})
}

func (h *AuthHandler) NaverLogin(c *fiber.Ctx) error {
    var req SocialLoginRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request body",
        })
    }

    fmt.Printf("Received from frontend - Code: %s, State: %s, RedirectURI: %s\n", 
        req.Code, req.State, req.RedirectURI)

    fmt.Printf("NAVER_CLIENT_ID: %s\n", h.cfg.NaverClientID)
    fmt.Printf("NAVER_CLIENT_SECRET exists: %v (length: %d)\n", 
        h.cfg.NaverClientSecret != "", len(h.cfg.NaverClientSecret))

    if h.cfg.NaverClientID == "" {
        fmt.Println("ERROR: NAVER_CLIENT_ID is empty!")
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "NAVER_CLIENT_ID not configured",
        })
    }
    if h.cfg.NaverClientSecret == "" {
        fmt.Println("ERROR: NAVER_CLIENT_SECRET is empty!")
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "NAVER_CLIENT_SECRET not configured",
        })
    }

    // 1. 네이버로부터 액세스 토큰 획득
    tokenURL := "https://nid.naver.com/oauth2.0/token"
    data := url.Values{}
    data.Set("grant_type", "authorization_code")
    data.Set("client_id", h.cfg.NaverClientID)
    data.Set("client_secret", h.cfg.NaverClientSecret)
    data.Set("code", req.Code)
    data.Set("state", req.State)

    fmt.Printf("Sending to Naver: %s\n", data.Encode())

    resp, err := http.PostForm(tokenURL, data)
    if err != nil {
        fmt.Printf("ERROR calling Naver token API: %v\n", err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to get access token from Naver",
        })
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Printf("ERROR reading response: %v\n", err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to read response from Naver",
        })
    }

    fmt.Printf("Naver API Response Status: %d\n", resp.StatusCode)
    fmt.Printf("Naver API Response Body: %s\n", string(body))

    if resp.StatusCode != 200 {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": fmt.Sprintf("Naver API error: %s", string(body)),
        })
    }

    fmt.Println("=== STEP 1: Before parsing token ===")
    
    var tokenResp NaverTokenResponse
    if err := json.Unmarshal(body, &tokenResp); err != nil {
        fmt.Printf("ERROR parsing token: %v\n", err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": fmt.Sprintf("Failed to parse token: %v", err),
        })
    }
    
    fmt.Println("=== STEP 2: After parsing token ===")
    fmt.Printf("Access Token: %s...\n", tokenResp.AccessToken[:20])
    fmt.Printf("Token Type: %s\n", tokenResp.TokenType)
    fmt.Printf("Expires In: %s\n", tokenResp.ExpiresIn)  // ⚠️ %s로 변경

    if tokenResp.AccessToken == "" {
        fmt.Println("ERROR: Access token is empty!")
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Access token is empty",
        })
    }

    // 2. 액세스 토큰으로 사용자 정보 획득
    fmt.Println("=== STEP 3: Before user info request ===")
    
    userInfoURL := "https://openapi.naver.com/v1/nid/me"
    req2, err := http.NewRequest("GET", userInfoURL, nil)
    if err != nil {
        fmt.Printf("ERROR creating request: %v\n", err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to create request for user info",
        })
    }
    req2.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)

    fmt.Printf("Requesting user info with token: Bearer %s...\n", tokenResp.AccessToken[:20])

    client := &http.Client{Timeout: 10 * time.Second}
    resp2, err := client.Do(req2)
    if err != nil {
        fmt.Printf("ERROR calling user API: %v\n", err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to get user info from Naver",
        })
    }
    defer resp2.Body.Close()

    fmt.Printf("User info API response status: %d\n", resp2.StatusCode)

    userBody, err := io.ReadAll(resp2.Body)
    if err != nil {
        fmt.Printf("ERROR reading user response: %v\n", err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to read user info response from Naver",
        })
    }

    fmt.Printf("User info API Response: %s\n", string(userBody))

    var userResp NaverUserResponse
    if err := json.Unmarshal(userBody, &userResp); err != nil {
        fmt.Printf("ERROR parsing user info: %v\n", err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to parse user info from Naver",
        })
    }

    fmt.Printf("Parsed user info - ID: %s, Email: %s, Name: %s\n", 
        userResp.Response.ID, userResp.Response.Email, userResp.Response.Name)

    // 3. 사용자 정보로 로그인 처리
    // nickname이 비어있으면 name을 사용, 둘 다 없으면 기본값
    username := userResp.Response.Nickname
    if username == "" {
        username = userResp.Response.Name
    }
    if username == "" {
        username = "닉네임 없음"
    }
    
    fmt.Printf("Final username to use: %s (nickname: %s, name: %s)\n", 
        username, userResp.Response.Nickname, userResp.Response.Name)
    
    return h.processSocialLogin(c, "naver", userResp.Response.ID, 
        userResp.Response.Email, username, userResp.Response.Profile)
}

// 카카오 소셜 로그인
func (h *AuthHandler) KakaoLogin(c *fiber.Ctx) error {
	var req SocialLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// 1. 카카오로부터 액세스 토큰 획득
	tokenURL := "https://kauth.kakao.com/oauth/token"
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", h.cfg.KakaoClientID)
	data.Set("client_secret", h.cfg.KakaoClientSecret)
	data.Set("code", req.Code)
	data.Set("redirect_uri", req.RedirectURI)

	resp, err := http.PostForm(tokenURL, data)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get access token from Kakao",
		})
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read response from Kakao",
		})
	}

	fmt.Printf("=== KAKAO TOKEN RESPONSE ===\n%s\n=== END TOKEN RESPONSE ===\n", string(body))

	var tokenResp KakaoTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		fmt.Printf("Token parsing error: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to parse token response from Kakao",
		})
	}

	fmt.Printf("=== PARSED TOKEN ===\nAccess Token: %s...\n=== END PARSED TOKEN ===\n", 
		tokenResp.AccessToken[:min(20, len(tokenResp.AccessToken))])

	// 2. 액세스 토큰으로 사용자 정보 획득
	userInfoURL := "https://kapi.kakao.com/v2/user/me"
	req2, err := http.NewRequest("GET", userInfoURL, nil)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create request for user info",
		})
	}
	req2.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp2, err := client.Do(req2)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user info from Kakao",
		})
	}
	defer resp2.Body.Close()

	userBody, err := io.ReadAll(resp2.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read user info response from Kakao",
		})
	}

	// Print the exact JSON response from Kakao
	fmt.Printf("=== EXACT KAKAO API RESPONSE ===\n%s\n=== END RESPONSE ===\n", string(userBody))

	var userResp KakaoUserResponse
	if err := json.Unmarshal(userBody, &userResp); err != nil {
		fmt.Printf("JSON parsing error: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to parse user info from Kakao",
		})
	}

	// 3. 사용자 정보로 로그인 처리
	socialID := fmt.Sprintf("%d", userResp.ID)
	email := userResp.KakaoAccount.Email
	username := userResp.Properties.Nickname
	if username == "" {
		username = "닉네임 없음"
	}
	profileImage := userResp.Properties.ProfileImage

	// Debug logging to identify the issue
	fmt.Printf("=== KAKAO LOGIN DEBUG ===\n")
	fmt.Printf("Raw ID from Kakao: %d\n", userResp.ID)
	fmt.Printf("SocialID string: %s\n", socialID)
	fmt.Printf("Email from Kakao: '%s'\n", email)
	fmt.Printf("Username: %s\n", username)
	fmt.Printf("========================\n")

	return h.processSocialLogin(c, "kakao", socialID, email, username, profileImage)
}

// 소셜 로그인 공통 처리 로직
func (h *AuthHandler) processSocialLogin(c *fiber.Ctx, provider, socialID, email, username, profileImage string) error {
	var user models.User
	fmt.Printf("=== PROCESS SOCIAL LOGIN ===\n")
	fmt.Printf("Provider: %s\n", provider)
	fmt.Printf("SocialID: '%s'\n", socialID) 
	fmt.Printf("Email: '%s'\n", email)
	fmt.Printf("Username: %s\n", username)
	fmt.Printf("===========================\n")
	// 소셜 ID로 기존 사용자 찾기
	err := h.db.Where("social_provider = ? AND social_id = ?", provider, socialID).First(&user).Error
	
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// 새 사용자 생성
			// 이메일로 기존 계정이 있는지 확인 (계정 연동)
			var existingUser models.User
			if email != "" {
				if err := h.db.Where("email = ?", email).First(&existingUser).Error; err == nil {
					// 기존 계정에 소셜 계정 연동
					existingUser.SocialProvider = provider
					existingUser.SocialID = socialID
					if profileImage != "" {
						existingUser.ProfileImage = profileImage
					}
					
					if err := h.db.Save(&existingUser).Error; err != nil {
						return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
							"error": "Failed to link social account",
						})
					}
					user = existingUser
				} else {
					// 완전히 새로운 사용자 생성
					user = models.User{
						Email:          email,
						Username:       username,
						Role:           "user", // Default role
						ProfileImage:   profileImage,
						SocialProvider: provider,
						SocialID:       socialID,
						CreatedAt:      time.Now(),
						UpdatedAt:      time.Now(),
					}

					if err := h.db.Create(&user).Error; err != nil {
						return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
							"error": "Failed to create user",
						})
					}
				}
			} else {
				// 새로운 사용자 생성 - 실제 카카오 이메일 사용
				actualEmail := email
				if actualEmail == "" {
					// 카카오에서 이메일을 제공하지 않는 경우에만 fallback 사용
					actualEmail = fmt.Sprintf("%s_%s@%s.social", provider, socialID, provider)
					fmt.Printf("=== EMAIL FALLBACK (no email from Kakao) ===\n")
					fmt.Printf("Provider: %s, SocialID: %s\n", provider, socialID)
					fmt.Printf("Generated fallback email: %s\n", actualEmail)
					fmt.Printf("==========================================\n")
				} else {
					fmt.Printf("=== USING ACTUAL KAKAO EMAIL ===\n")
					fmt.Printf("Kakao provided email: %s\n", actualEmail)
					fmt.Printf("================================\n")
				}
				
				user = models.User{
					Email:          actualEmail,
					Username:       username,
					Role:           "user", // Default role
					ProfileImage:   profileImage,
					SocialProvider: provider,
					SocialID:       socialID,
					CreatedAt:      time.Now(),
					UpdatedAt:      time.Now(),
				}

				if err := h.db.Create(&user).Error; err != nil {
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
						"error": "Failed to create user",
					})
				}
			}
		} else {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Database error",
			})
		}
	}
	
	// JWT 토큰 생성
	token, err := utils.GenerateJWT(user.ID, user.Email, h.cfg.JWTSecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	// Capitalize first letter of provider name
	var providerName string
	if len(provider) > 0 {
		providerName = string(provider[0]-32) + provider[1:] // Convert first char to uppercase
	} else {
		providerName = provider
	}
	
	return c.JSON(fiber.Map{
		"user":  user,
		"token": token,
		"message": fmt.Sprintf("%s 로그인 성공", providerName),
	})
}