// Package docs Sikjipsa Backend API
//
// This is the API documentation for the Sikjipsa plant care application.
//
//	Title: Sikjipsa Backend API
//	Description: Plant care application backend API
//	Version: 1.0.0
//	Host: localhost:8080
//	BasePath: /api/v1
//	Schemes: http, https
//
//	SecurityDefinitions:
//	Bearer:
//		type: apiKey
//		name: Authorization
//		in: header
//		description: "Type 'Bearer' followed by a space and JWT token."
//
// swagger:meta
package docs

import "github.com/swaggo/swag"

const docTemplate = `{
    "schemes": {{ marshal .Schemes }},
    "swagger": "2.0",
    "info": {
        "description": "{{escape .Description}}",
        "title": "{{.Title}}",
        "version": "{{.Version}}"
    },
    "host": "{{.Host}}",
    "basePath": "{{.BasePath}}",
    "paths": {},
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Type 'Bearer' followed by a space and JWT token."
        }
    }
}`

// SwaggerInfo holds exported Swagger Info so clients can modify it
var SwaggerInfo = &swag.Spec{
	Version:          "1.0.0",
	Host:             "localhost:8080",
	BasePath:         "/api/v1",
	Schemes:          []string{"http", "https"},
	Title:            "Sikjipsa Backend API",
	Description:      "Plant care application backend API with authentication, plant management, community features, growth diary, and plant diagnosis.",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), SwaggerInfo)
}