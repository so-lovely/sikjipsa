package handlers

import (
	"mime/multipart"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// isValidImageFile validates if the uploaded file is a valid image
func isValidImageFile(file *multipart.FileHeader) bool {
	// 파일 크기 체크 (5MB 제한)
	if file.Size > 10*1024*1024 {
		return false
	}
	
	// 파일 확장자 체크
	ext := strings.ToLower(filepath.Ext(file.Filename))
	validExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	
	for _, validExt := range validExts {
		if ext == validExt {
			return true
		}
	}
	
	return false
}

// Cache implementation
type CacheItem struct {
	Data      interface{}
	ExpiresAt time.Time
}

var (
	plantCache = sync.Map{}
	cacheTTL   = 24 * time.Hour
)

// GetFromCache retrieves data from cache if it exists and hasn't expired
func GetFromCache(key string) (interface{}, bool) {
	if item, ok := plantCache.Load(key); ok {
		cacheItem := item.(CacheItem)
		if time.Now().Before(cacheItem.ExpiresAt) {
			return cacheItem.Data, true
		}
		plantCache.Delete(key)
	}
	return nil, false
}

// SetCache stores data in cache with TTL
func SetCache(key string, data interface{}) {
	plantCache.Store(key, CacheItem{
		Data:      data,
		ExpiresAt: time.Now().Add(cacheTTL),
	})
}

// ClearCache removes all cached data
func ClearCache() {
	plantCache.Range(func(key, value interface{}) bool {
		plantCache.Delete(key)
		return true
	})
}

// GenerateCacheKey creates a cache key from query parameters
func GenerateCacheKey(prefix string, params ...string) string {
	key := prefix
	for _, param := range params {
		if param != "" {
			key += "_" + param
		}
	}
	return key
}