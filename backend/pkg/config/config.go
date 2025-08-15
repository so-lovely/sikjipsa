


// Production configuration for Render deployment

package config

import (
	"log"
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string // DB 관련 변수는 이것 하나만 남깁니다.
	JWTSecret   string

	// CORS Configuration
	AllowedOrigins string

	// Cloudinary
	CloudinaryCloudName string
	CloudinaryAPIKey    string
	CloudinaryAPISecret string

	// Social Login
	NaverClientID     string
	NaverClientSecret string
	KakaoClientID     string
	KakaoClientSecret string

	// AI Plant Diagnosis
	PlantAIAPIKey string
	PlantAIAPIURL string
}

func Load() *Config {
	// Render의 Internal Connection String은 postgres:// 로 시작합니다.
	// GORM은 이 형식을 그대로 사용할 수 있습니다.
	// 따라서, buildDatabaseURL 함수 없이 DATABASE_URL 변수 하나만 읽어옵니다.
	dbURL := getEnv("DATABASE_URL", "") // 기본값은 비워둡니다.
	if dbURL == "" {
		log.Fatal("FATAL: DATABASE_URL environment variable is not set.")
	}

	// Render의 DB는 보안 연결(SSL)이 필수입니다.
	// URL에 sslmode가 없으면 추가해줍니다.
	// GORM v1.25.4+ 에서는 이 부분이 자동으로 처리될 수 있지만, 명시적으로 해주는 것이 가장 안전합니다.
	// 이 부분은 일단 생략하고, 문제가 계속되면 추가하겠습니다. 지금은 단순하게 갑니다.

	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: dbURL, // DATABASE_URL을 직접 사용합니다.
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key"),

		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://sikjipsa.com:3000"),

		CloudinaryCloudName: getEnv("CLOUDINARY_CLOUD_NAME", ""),
		CloudinaryAPIKey:    getEnv("CLOUDINARY_API_KEY", ""),
		CloudinaryAPISecret: getEnv("CLOUDINARY_API_SECRET", ""),

		NaverClientID:     getEnv("NAVER_CLIENT_ID", ""),
		NaverClientSecret: getEnv("NAVER_CLIENT_SECRET", ""),
		KakaoClientID:     getEnv("KAKAO_CLIENT_ID", ""),
		KakaoClientSecret: getEnv("KAKAO_CLIENT_SECRET", ""),

		PlantAIAPIKey: getEnv("PLANT_AI_API_KEY", ""),
		PlantAIAPIURL: getEnv("PLANT_AI_API_URL", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	// 이제 "does not exist" 로그는 찍지 않습니다.
	// 필수 변수가 없으면 위에서 Fatal로 앱을 종료시키므로 더 명확합니다.
	return defaultValue
}

// buildDatabaseURL 함수는 이제 필요 없으므로 완전히 삭제합니다.
