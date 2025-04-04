package routes

import (
	"net/http"
	"strings"

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
	coffeeShopDetailsHandler := handlers.NewCoffeeShopDetailsHandler(db, placesService)

	// Handle /coffee_shops/{placeId} and /coffee_shops
	mux.HandleFunc("/coffee_shops/", func(w http.ResponseWriter, r *http.Request) {
		// Extract path after /coffee_shops/
		path := strings.TrimPrefix(r.URL.Path, "/coffee_shops/")

		// If there's a placeId in the path, route to the details handler
		if path != "" {
			authMiddleware(db, coffeeShopDetailsHandler.HandleCoffeeShopDetails)(w, r)
			return
		}

		// Otherwise, route to the list handler
		authMiddleware(db, coffeeShopsHandler.HandleCoffeeShops)(w, r)
	})

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
