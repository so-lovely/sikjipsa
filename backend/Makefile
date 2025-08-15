# Makefile for sikjipsa-backend

.PHONY: test test-unit test-integration test-coverage build clean run dev lint

# Default target
all: build

# Build the application
build:
	go build -o bin/sikjipsa-backend ./cmd/api

# Run the application
run:
	go run ./cmd/api

# Development mode with air (if available)
dev:
	@if command -v air >/dev/null 2>&1; then \
		air; \
	else \
		echo "Air not found. Install with: go install github.com/cosmtrek/air@latest"; \
		go run ./cmd/api; \
	fi

# Run all tests
test:
	go test -v ./tests/...

# Run unit tests only
test-unit:
	go test -v ./tests/unit/...

# Run integration tests only
test-integration:
	go test -v ./tests/integration/...

# Run tests with coverage
test-coverage:
	go test -v -cover -coverprofile=coverage.out ./tests/...
	go tool cover -html=coverage.out -o coverage.html

# Run tests with race detection
test-race:
	go test -v -race ./tests/...

# Lint code
lint:
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not found. Install with: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
		go vet ./...; \
	fi

# Format code
fmt:
	go fmt ./...

# Tidy dependencies
tidy:
	go mod tidy

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html

# Install development dependencies
install-dev:
	go install github.com/cosmtrek/air@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Database migration (if you have a migration tool)
migrate-up:
	@echo "Add your migration command here"

migrate-down:
	@echo "Add your migration command here"

# Docker commands
docker-build:
	docker build -t sikjipsa-backend .

docker-run:
	docker run -p 8080:8080 sikjipsa-backend

# Help
help:
	@echo "Available targets:"
	@echo "  build         - Build the application"
	@echo "  run           - Run the application"
	@echo "  dev           - Run in development mode with hot reload"
	@echo "  test          - Run all tests"
	@echo "  test-unit     - Run unit tests only"
	@echo "  test-integration - Run integration tests only"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  test-race     - Run tests with race detection"
	@echo "  lint          - Lint the code"
	@echo "  fmt           - Format the code"
	@echo "  tidy          - Tidy dependencies"
	@echo "  clean         - Clean build artifacts"
	@echo "  install-dev   - Install development dependencies"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-run    - Run Docker container"
	@echo "  help          - Show this help"