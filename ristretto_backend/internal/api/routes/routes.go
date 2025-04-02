package routes

import (
	"net/http"

	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/api/handlers"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/config"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/db"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/services"
)

// Middleware defines a function that wraps a http.HandlerFunc
type Middleware func(*db.DB, http.HandlerFunc) http.HandlerFunc

// Register registers all routes with the provided http.ServeMux
func Register(mux *http.ServeMux, db *db.DB, authMiddleware Middleware) {
	// Create services
	placesService := services.NewPlacesService(getGoogleAPIKey())

	// Coffee Shops routes
	coffeeShopsHandler := handlers.NewCoffeeShopsHandler(db, placesService)
	mux.HandleFunc("/coffee_shops", authMiddleware(db, coffeeShopsHandler.HandleCoffeeShops))

	// User routes
	userHandler := handlers.NewUserHandler(db)
	mux.HandleFunc("/user", authMiddleware(db, userHandler.HandleUser))

	// Favorites routes
	favoritesHandler := handlers.NewFavoritesHandler(db)
	mux.HandleFunc("/favorites", authMiddleware(db, favoritesHandler.HandleFavorites))

	// Visits routes
	visitsHandler := handlers.NewVisitsHandler(db)
	mux.HandleFunc("/visits", authMiddleware(db, visitsHandler.HandleVisits))
}

// getGoogleAPIKey retrieves the Google API key from environment variables
func getGoogleAPIKey() string {
	cfg := config.Load()

	return cfg.Google.PlacesAPIKey // Placeholder, should be loaded from environment variables
}
