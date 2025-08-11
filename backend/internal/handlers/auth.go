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

	// 닉네임 중복 확인 (자신 제외)
	var existingUser models.User
	if err := h.db.Where("username = ? AND id != ?", req.Username, userID).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Username already exists",
		})
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
    // nickname이 비어있으면 name을 사용
    username := userResp.Response.Nickname
    if username == "" {
        username = userResp.Response.Name
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

	var tokenResp KakaoTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to parse token response from Kakao",
		})
	}

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

	var userResp KakaoUserResponse
	if err := json.Unmarshal(userBody, &userResp); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to parse user info from Kakao",
		})
	}

	// 3. 사용자 정보로 로그인 처리
	socialID := fmt.Sprintf("%d", userResp.ID)
	email := userResp.KakaoAccount.Email
	username := userResp.Properties.Nickname
	profileImage := userResp.Properties.ProfileImage

	return h.processSocialLogin(c, "kakao", socialID, email, username, profileImage)
}

// 소셜 로그인 공통 처리 로직
func (h *AuthHandler) processSocialLogin(c *fiber.Ctx, provider, socialID, email, username, profileImage string) error {
	var user models.User
	fmt.Printf("Processing social login - Provider: %s, ID: %s, Email: %s, Username: %s\n", 
        provider, socialID, email, username)
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
				// 이메일이 없는 경우 (일부 소셜 서비스)
				user = models.User{
					Email:          fmt.Sprintf("%s_%s@%s.social", provider, socialID, provider),
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