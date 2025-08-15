FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.sum ./
COPY go.mod ./

RUN go mod download

COPY . .
RUN go get gorm.io/gorm@v1.25.5
RUN go get gorm.io/driver/postgres@v1.5.4
RUN go get gorm.io/datatypes@v1.2.0
RUN go mod tidy

RUN go build -o main cmd/api/main.go

FROM alpine:latest

RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]