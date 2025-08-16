package handlers

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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

type DiagnosisHandler struct {
	db    *gorm.DB
	cfg   *config.Config
	cache *cache.RedisCache
}

func NewDiagnosisHandler(db *gorm.DB, cfg *config.Config, redisCache *cache.RedisCache) *DiagnosisHandler {
	return &DiagnosisHandler{db: db, cfg: cfg, cache: redisCache}
}

// Plant.id API v3 Request/Response structures
type PlantIDRequest struct {
	Images         []string `json:"images"`
	Latitude       float64  `json:"latitude,omitempty"`
	Longitude      float64  `json:"longitude,omitempty"`
	SimilarImages  bool     `json:"similar_images,omitempty"`
	Health         string   `json:"health,omitempty"`
	Symptoms       bool     `json:"symptoms,omitempty"`
}

type PlantIDResponse struct {
	AccessToken   string          `json:"access_token"`
	ModelVersion  string          `json:"model_version"`
	CustomID      interface{}     `json:"custom_id"`
	Input         InputData       `json:"input"`
	Result        ResultData      `json:"result"`
	Status        string          `json:"status"`
	Created       float64         `json:"created"`
	Completed     float64         `json:"completed"`
}

type InputData struct {
	Latitude      float64  `json:"latitude"`
	Longitude     float64  `json:"longitude"`
	SimilarImages bool     `json:"similar_images"`
	Health        string   `json:"health,omitempty"`
	Images        []string `json:"images"`
}

type ResultData struct {
	IsPlant        IsPlantData        `json:"is_plant"`
	Classification ClassificationData `json:"classification,omitempty"`
	IsHealthy      IsHealthyData      `json:"is_healthy,omitempty"`
	Disease        DiseaseData        `json:"disease,omitempty"`
}

type IsPlantData struct {
	Probability float64 `json:"probability"`
	Binary      bool    `json:"binary"`
	Threshold   float64 `json:"threshold"`
}

type ClassificationData struct {
	Suggestions []PlantSuggestion `json:"suggestions"`
}

type IsHealthyData struct {
	Probability float64 `json:"probability"`
	Binary      bool    `json:"binary"`
	Threshold   float64 `json:"threshold"`
}

type DiseaseData struct {
	Suggestions []DiseaseSuggestion `json:"suggestions"`
	Question    QuestionData        `json:"question,omitempty"`
}

type QuestionData struct {
	Text        string                 `json:"text"`
	Translation string                 `json:"translation"`
	Options     map[string]interface{} `json:"options"`
}

type PlantSuggestion struct {
	ID            string           `json:"id"`
	Name          string           `json:"name"`
	Probability   float64          `json:"probability"`
	SimilarImages []SimilarImage   `json:"similar_images"`
	Details       PlantDetails     `json:"details"`
}

type SimilarImage struct {
	ID          string  `json:"id"`
	URL         string  `json:"url"`
	Similarity  float64 `json:"similarity"`
	URLSmall    string  `json:"url_small"`
	LicenseName string  `json:"license_name,omitempty"`
	LicenseURL  string  `json:"license_url,omitempty"`
	Citation    string  `json:"citation,omitempty"`
}

type PlantDetails struct {
	Language string `json:"language"`
	EntityID string `json:"entity_id"`
}


type DiseaseSuggestion struct {
	ID            string         `json:"id"`
	Name          string         `json:"name"`
	Probability   float64        `json:"probability"`
	SimilarImages []SimilarImage `json:"similar_images"`
	Details       PlantDetails   `json:"details"`
}

// API endpoint for plant diagnosis
func (h *DiagnosisHandler) AnalyzePlant(c *fiber.Ctx) error {
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

	// Check if API key is configured
	if h.cfg.PlantAIAPIKey == "" {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Plant AI service is not configured",
		})
	}

	// 이미지 파일 처리
	form, err := c.MultipartForm()
	if err != nil || form.File["image"] == nil || len(form.File["image"]) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Image file is required",
		})
	}

	file := form.File["image"][0]
	
	// 위치 정보 받기 (선택적)
	var latitude, longitude float64
	if latStr := c.FormValue("latitude"); latStr != "" {
		if lat, err := strconv.ParseFloat(latStr, 64); err == nil {
			latitude = lat
		}
	}
	if lngStr := c.FormValue("longitude"); lngStr != "" {
		if lng, err := strconv.ParseFloat(lngStr, 64); err == nil {
			longitude = lng
		}
	}

	// 파일 검증
	if !isValidImageFile(file) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid image file. Only JPG, PNG, WEBP files under 10MB are allowed",
		})
	}

	// Cloudinary에 이미지 업로드
	cld, err := cloudinary.NewFromParams(h.cfg.CloudinaryCloudName, h.cfg.CloudinaryAPIKey, h.cfg.CloudinaryAPISecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initialize image upload service",
		})
	}

	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to process image file",
		})
	}
	defer src.Close()

	uploadResult, err := cld.Upload.Upload(context.Background(), src, uploader.UploadParams{
		Folder:         "sikjipsa/diagnosis",
		ResourceType:   "image",
		Transformation: "c_limit,w_1500,h_1500,q_auto:good",
	})

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to upload image",
		})
	}

	// 데이터베이스에 진단 요청 저장
	diagnosisRequest := models.DiagnosisRequest{
		UserID:   uid,
		ImageURL: uploadResult.SecureURL,
		Status:   "processing",
	}

	if err := h.db.Create(&diagnosisRequest).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create diagnosis request",
		})
	}

	// Plant.id API 호출을 위해 이미지를 base64로 인코딩
	src, err = file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to process image for analysis",
		})
	}
	defer src.Close()

	imageBytes, err := io.ReadAll(src)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read image data",
		})
	}

	base64Image := base64.StdEncoding.EncodeToString(imageBytes)
	base64ImageWithPrefix := "data:image/" + getImageMimeType(file.Filename) + ";base64," + base64Image

	// Plant.id API 호출
	go h.processPlantAnalysis(diagnosisRequest.ID, base64ImageWithPrefix, latitude, longitude)

	return c.JSON(fiber.Map{
		"message":      "Analysis started",
		"diagnosis_id": diagnosisRequest.ID,
		"status":       "processing",
	})
}

// 비동기로 Plant.id API 호출 및 결과 처리
func (h *DiagnosisHandler) processPlantAnalysis(diagnosisID uint, base64Image string, latitude, longitude float64) {
	// 1. 먼저 식물 식별 API 호출
	identificationURL := "https://plant.id/api/v3/identification"
	identificationData := PlantIDRequest{
		Images:        []string{base64Image},
		Latitude:      latitude,
		Longitude:     longitude,
		SimilarImages: true,
	}
	
	identificationResult, err := h.callPlantAPI(identificationURL, identificationData)
	if err != nil {
		logger.Error("Plant identification failed", "error", err)
		// 식별 실패해도 건강 진단은 시도
	}
	
	// 2. 건강 진단 API 호출
	healthURL := "https://plant.id/api/v3/health_assessment"
	healthData := PlantIDRequest{
		Images:         []string{base64Image},
		Latitude:       latitude,
		Longitude:      longitude,
		SimilarImages:  true,
		Health:         "only",
		Symptoms: 		true,
	}
	
	healthResult, err := h.callPlantAPI(healthURL, healthData)
	if err != nil {
		h.updateDiagnosisStatus(diagnosisID, "failed", "Health assessment failed: "+err.Error())
		return
	}
	
	// 3. 두 결과를 합쳐서 저장
	h.saveCombinedDiagnosisResult(diagnosisID, identificationResult, healthResult)
}

// Plant.id API 호출 공통 함수
func (h *DiagnosisHandler) callPlantAPI(apiURL string, requestData PlantIDRequest) (*PlantIDResponse, error) {
	jsonData, err := json.Marshal(requestData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request data: %v", err)
	}

	logger.Info("Calling Plant.id API", "url", apiURL)

	// HTTP 클라이언트 설정
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Api-Key", h.cfg.PlantAIAPIKey)

	// API 호출
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		logger.Error("Plant.id API error", "statusCode", resp.StatusCode, "response", string(body))
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(body))
	}

	// API 응답 파싱
	var apiResponse PlantIDResponse
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}
	
	logger.Info("Plant.id API response received", "url", apiURL, "statusCode", resp.StatusCode)
	
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		logger.Error("Failed to parse Plant.id API response", "error", err)
		return nil, fmt.Errorf("failed to parse API response: %v", err)
	}

	logger.Info("Plant.id API analysis completed", 
		"status", apiResponse.Status,
		"classificationCount", len(apiResponse.Result.Classification.Suggestions),
		"diseaseCount", len(apiResponse.Result.Disease.Suggestions),
		"isHealthy", apiResponse.Result.IsHealthy.Binary)

	return &apiResponse, nil
}

// 식별 결과와 건강 진단 결과를 합쳐서 저장
func (h *DiagnosisHandler) saveCombinedDiagnosisResult(diagnosisID uint, identificationResult *PlantIDResponse, healthResult *PlantIDResponse) {
	var diagnosisRequest models.DiagnosisRequest
	if err := h.db.First(&diagnosisRequest, diagnosisID).Error; err != nil {
		return
	}

	// 식물 식별 결과 (identification API에서)
	var plantName, scientificName string
	var confidence float64 = 0

	if identificationResult != nil && identificationResult.Result.Classification.Suggestions != nil && len(identificationResult.Result.Classification.Suggestions) > 0 {
		topSuggestion := identificationResult.Result.Classification.Suggestions[0]
		plantName = topSuggestion.Name
		confidence = topSuggestion.Probability * 100
	} else {
		plantName = "식물"
		confidence = 50.0
	}

	// 건강 상태 결과 (health assessment API에서)
	var isHealthy bool = true
	var healthConfidence float64 = 100.0
	
	if healthResult != nil {
		isHealthy = healthResult.Result.IsHealthy.Binary
		healthConfidence = healthResult.Result.IsHealthy.Probability * 100
	}

	// 질병 정보 (health assessment API에서)
	var diseases []models.DiseaseAssessment
	var suggestions []models.DiagnosisSuggestion

	if healthResult != nil && len(healthResult.Result.Disease.Suggestions) > 0 {
		logger.Info("Processing disease suggestions", "count", len(healthResult.Result.Disease.Suggestions))
		
		for i, disease := range healthResult.Result.Disease.Suggestions {
			logger.Debug("Processing disease suggestion", "index", i, "name", disease.Name, "probability", disease.Probability)
			
			// 신뢰도가 10% 이상인 것만 표시
			if disease.Probability >= 0.10 {
				diseases = append(diseases, models.DiseaseAssessment{
					DiseaseName: disease.Name,
					Confidence:  disease.Probability * 100,
					Description: fmt.Sprintf("%.1f%% 확률로 감지된 질병입니다", disease.Probability*100),
					Treatment:   "전문가의 조언을 구하시기 바랍니다.",
				})

				// 질병별 치료 제안 추가
				suggestions = append(suggestions, models.DiagnosisSuggestion{
					Category: "disease_treatment",
					Message:  fmt.Sprintf("%s 증상이 감지되었습니다. 전문가의 조언을 구하시기 바랍니다.", disease.Name),
				})
			}
		}
	}
	
	// 건강한 식물이거나 질병이 발견되지 않은 경우 일반적인 관리 조언 추가
	if isHealthy || len(diseases) == 0 {
		suggestions = append(suggestions, 
			models.DiagnosisSuggestion{
				Category: "general",
				Message:  "식물이 건강한 상태로 보입니다.",
			},
			models.DiagnosisSuggestion{
				Category: "watering",
				Message:  "적절한 물주기를 유지하세요.",
			},
			models.DiagnosisSuggestion{
				Category: "lighting", 
				Message:  "밝은 간접광에서 관리하세요.",
			},
			models.DiagnosisSuggestion{
				Category: "nutrition",
				Message:  "한 달에 한 번 액체비료를 주면 좋습니다.",
			},
		)
	}

	// JSON 데이터 변환
	diseasesJSON, _ := json.Marshal(diseases)
	suggestionsJSON, _ := json.Marshal(suggestions)
	
	// 두 API 응답을 모두 저장
	combinedResponse := map[string]interface{}{
		"identification": identificationResult,
		"health": healthResult,
	}
	apiResponseJSON, _ := json.Marshal(combinedResponse)

	// 데이터베이스 업데이트
	diagnosisRequest.PlantName = plantName
	diagnosisRequest.ScientificName = scientificName
	diagnosisRequest.Confidence = confidence
	diagnosisRequest.IsHealthy = isHealthy
	diagnosisRequest.HealthConfidence = healthConfidence
	diagnosisRequest.Diseases = diseasesJSON
	diagnosisRequest.Suggestions = suggestionsJSON
	diagnosisRequest.APIResponse = apiResponseJSON
	diagnosisRequest.Status = "completed"

	h.db.Save(&diagnosisRequest)
}


// 진단 상태 업데이트
func (h *DiagnosisHandler) updateDiagnosisStatus(diagnosisID uint, status, errorMessage string) {
	h.db.Model(&models.DiagnosisRequest{}).Where("id = ?", diagnosisID).Updates(map[string]interface{}{
		"status":        status,
		"error_message": errorMessage,
	})
}

// 진단 결과 조회
func (h *DiagnosisHandler) GetDiagnosisResult(c *fiber.Ctx) error {
	diagnosisID := c.Params("id")
	
	var diagnosisRequest models.DiagnosisRequest
	if err := h.db.Preload("User").First(&diagnosisRequest, diagnosisID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Diagnosis not found",
		})
	}

	// 응답 데이터 구성
	response := fiber.Map{
		"id":                diagnosisRequest.ID,
		"status":           diagnosisRequest.Status,
		"image_url":        diagnosisRequest.ImageURL,
		"plant_name":       diagnosisRequest.PlantName,
		"scientific_name":  diagnosisRequest.ScientificName,
		"confidence":       diagnosisRequest.Confidence,
		"is_healthy":       diagnosisRequest.IsHealthy,
		"health_confidence": diagnosisRequest.HealthConfidence,
		"created_at":       diagnosisRequest.CreatedAt,
	}

	if diagnosisRequest.Status == "failed" {
		response["error_message"] = diagnosisRequest.ErrorMessage
	}

	if diagnosisRequest.Status == "completed" {
		// JSON 데이터 파싱
		var diseases []models.DiseaseAssessment
		var suggestions []models.DiagnosisSuggestion

		if diagnosisRequest.Diseases != nil {
			json.Unmarshal(diagnosisRequest.Diseases, &diseases)
		}
		
		if diagnosisRequest.Suggestions != nil {
			json.Unmarshal(diagnosisRequest.Suggestions, &suggestions)
		}

		response["diseases"] = diseases
		response["suggestions"] = suggestions
	}

	return c.JSON(response)
}

// 사용자의 진단 히스토리 조회
func (h *DiagnosisHandler) GetDiagnosisHistory(c *fiber.Ctx) error {
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

	var diagnosisRequests []models.DiagnosisRequest
	if err := h.db.Where("user_id = ?", uid).Order("created_at DESC").Limit(50).Find(&diagnosisRequests).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch diagnosis history",
		})
	}

	return c.JSON(diagnosisRequests)
}

// 유틸리티 함수들
func getImageMimeType(filename string) string {
	if len(filename) < 4 {
		return "jpeg"
	}
	ext := filename[len(filename)-4:]
	switch ext {
	case ".png", ".PNG":
		return "png"
	case ".webp", ".WEBP":
		return "webp"
	default:
		return "jpeg"
	}
}