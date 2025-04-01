package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/api/middleware"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/api/routes"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/config"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/db"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Load application config
	cfg := config.Load()

	// Initialize database
	database, err := db.Connect(cfg.Database.ConnectionString)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Create router and register routes
	mux := http.NewServeMux()

	// Register routes
	routes.Register(mux, database, middleware.Auth)

	// Health check route (no auth required)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Determine port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	fmt.Printf("Server starting on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
