package handlers

import (
	"mime/multipart"
	"path/filepath"
	"strings"
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