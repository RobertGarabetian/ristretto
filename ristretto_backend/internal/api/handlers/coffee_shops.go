package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/db"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/models"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/services"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/pkg/utils"
)

// CoffeeShopsHandler handles requests for coffee shops
type CoffeeShopsHandler struct {
	db            *db.DB
	placesService *services.PlacesService
}

// NewCoffeeShopsHandler creates a new CoffeeShopsHandler
func NewCoffeeShopsHandler(db *db.DB, placesService *services.PlacesService) *CoffeeShopsHandler {
	return &CoffeeShopsHandler{
		db:            db,
		placesService: placesService,
	}
}

// HandleCoffeeShops handles GET requests for coffee shops
func (h *CoffeeShopsHandler) HandleCoffeeShops(w http.ResponseWriter, r *http.Request) {
	log.Printf("getCoffeeShops handler called: %s %s", r.Method, r.URL.String())

	if r.Method != http.MethodGet {
		log.Printf("ERROR: Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from request header
	userIDStr := r.Header.Get("X-User-ID")
	log.Printf("X-User-ID header: %s", userIDStr)

	userID, err := utils.ParseInt(userIDStr)
	if err != nil {
		log.Printf("ERROR: Invalid user ID: %s, error: %v", userIDStr, err)
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}
	log.Printf("User ID parsed: %d", userID)

	// Parse query parameters
	latitude := 37.7937 // Default values
	longitude := -122.3965
	radius := 500.0
	maxResults := 10

	// Log query parameters
	log.Printf("Query parameters: %v", r.URL.Query())

	// Extract from query params if provided
	if lat := r.URL.Query().Get("lat"); lat != "" {
		if parsedLat, err := strconv.ParseFloat(lat, 64); err == nil {
			latitude = parsedLat
			log.Printf("Using provided latitude: %f", latitude)
		}
	}
	if lng := r.URL.Query().Get("lng"); lng != "" {
		if parsedLng, err := strconv.ParseFloat(lng, 64); err == nil {
			longitude = parsedLng
			log.Printf("Using provided longitude: %f", longitude)
		}
	}
	if rad := r.URL.Query().Get("radius"); rad != "" {
		if parsedRad, err := strconv.ParseFloat(rad, 64); err == nil {
			radius = parsedRad
			log.Printf("Using provided radius: %f", radius)
		}
	}
	if max := r.URL.Query().Get("max"); max != "" {
		if parsedMax, err := strconv.Atoi(max); err == nil {
			maxResults = parsedMax
			log.Printf("Using provided max results: %d", maxResults)
		}
	}

	// Fetch coffee shops from Google Places API
	places, err := h.placesService.SearchNearby(latitude, longitude, radius, maxResults)
	if err != nil {
		log.Printf("ERROR: Failed to fetch coffee shops: %v", err)

		// Return mock data for development if Google Places API fails
		if isDevEnvironment() {
			log.Println("Development environment detected, returning mock data")
			mockResponse := createMockResponse(latitude, longitude)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(mockResponse)
			return
		}

		http.Error(w, "Failed to fetch coffee shops", http.StatusInternalServerError)
		return
	}

	// Fetch user's favorites
	favoriteIDs, err := h.db.GetUserFavorites(userID)
	if err != nil {
		log.Printf("Error fetching user favorites: %v", err)
		// Continue without favorites rather than failing
		favoriteIDs = make(map[string]bool)
	}

	// Extract coffee shop data
	var coffeeShops []models.CoffeeShop
	for _, place := range places {
		coffeeShop := models.CoffeeShop{
			ID:         place.PlaceID,
			Name:       place.DisplayName.Text,
			Latitude:   place.Location.Latitude,
			Longitude:  place.Location.Longitude,
			IsFavorite: favoriteIDs[place.PlaceID],
			Photos:     place.Photos,
		}
		coffeeShops = append(coffeeShops, coffeeShop)
	}

	// Prepare our response
	response := models.CoffeeShopsResponse{
		CoffeeShops: coffeeShops,
	}

	log.Printf("Sending response with %d coffee shops", len(coffeeShops))

	// Send response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("ERROR: Failed to encode response: %v", err)
	}
}

// isDevEnvironment returns true if we're running in a development environment
func isDevEnvironment() bool {
	// In a real application, you would check an environment variable
	// For now, we'll just return true to enable mock data
	return true
}

// createMockResponse creates a mock response for development
func createMockResponse(latitude, longitude float64) models.CoffeeShopsResponse {
	return models.CoffeeShopsResponse{
		CoffeeShops: []models.CoffeeShop{
			{
				ID:         "mock_1",
				Name:       "Café Sunrise",
				Latitude:   latitude,
				Longitude:  longitude,
				IsFavorite: false,
			},
			{
				ID:         "mock_2",
				Name:       "Bean Town",
				Latitude:   latitude + 0.001,
				Longitude:  longitude - 0.001,
				IsFavorite: false,
			},
			{
				ID:         "mock_3",
				Name:       "Morning Brew",
				Latitude:   latitude - 0.002,
				Longitude:  longitude + 0.002,
				IsFavorite: true,
			},
		},
	}
}
