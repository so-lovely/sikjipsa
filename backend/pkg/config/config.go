package config

import (
	"os"
	"log"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	
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
	
	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: buildDatabaseURL(),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key"),
		
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
	if value := os.Getenv(key); value != "" {
		return value
	}
	log.Printf("%v does not exist\n", key)
	return defaultValue
}

func buildDatabaseURL() string {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "")
	dbname := getEnv("DB_NAME", "sikjipsa_db")
	sslmode := getEnv("DB_SSLMODE", "disable")
	
	return "host=" + host + " port=" + port + " user=" + user + " password=" + password + " dbname=" + dbname + " sslmode=" + sslmode
}