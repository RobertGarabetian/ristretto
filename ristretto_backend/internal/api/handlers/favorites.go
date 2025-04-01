package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/db"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/models"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/pkg/utils"
)

// FavoritesHandler handles requests for favorites
type FavoritesHandler struct {
	db *db.DB
}

// NewFavoritesHandler creates a new FavoritesHandler
func NewFavoritesHandler(db *db.DB) *FavoritesHandler {
	return &FavoritesHandler{
		db: db,
	}
}

// HandleFavorites handles requests for favorites
func (h *FavoritesHandler) HandleFavorites(w http.ResponseWriter, r *http.Request) {
	// Get user ID from request header
	userIDStr := r.Header.Get("X-User-ID")
	userID, err := utils.ParseInt(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	log.Printf("Handling favorites request: %s for user ID: %d", r.Method, userID)

	switch r.Method {
	case http.MethodGet:
		h.getFavorites(w, r, userID)
	case http.MethodPost:
		h.addFavorite(w, r, userID)
	case http.MethodDelete:
		h.removeFavorite(w, r, userID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// getFavorites gets a user's favorite coffee shops
func (h *FavoritesHandler) getFavorites(w http.ResponseWriter, r *http.Request, userID int) {
	log.Printf("Getting favorites for user ID: %d", userID)

	favorites, err := h.db.GetFavorites(userID)
	if err != nil {
		log.Printf("Database error fetching favorites: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Convert to CoffeeShop objects
	coffeeShops := make([]models.CoffeeShop, 0, len(favorites))
	for _, fav := range favorites {
		coffeeShops = append(coffeeShops, models.CoffeeShop{
			ID:         fav["id"].(string),
			Name:       fav["name"].(string),
			Latitude:   fav["latitude"].(float64),
			Longitude:  fav["longitude"].(float64),
			IsFavorite: true,
		})
	}

	log.Printf("Found %d favorites for user ID: %d", len(coffeeShops), userID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"favorites": coffeeShops,
	})
}

// addFavorite adds a coffee shop to favorites
func (h *FavoritesHandler) addFavorite(w http.ResponseWriter, r *http.Request, userID int) {
	var coffeeShop models.CoffeeShop

	if err := json.NewDecoder(r.Body).Decode(&coffeeShop); err != nil {
		log.Printf("Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if coffeeShop.ID == "" || coffeeShop.Name == "" {
		log.Printf("Missing required fields: ID or Name")
		http.Error(w, "Place ID and Name are required", http.StatusBadRequest)
		return
	}

	log.Printf("Adding coffee shop %s (%s) to favorites for user ID: %d",
		coffeeShop.Name, coffeeShop.ID, userID)

	err := h.db.AddFavorite(userID, coffeeShop.ID, coffeeShop.Name, coffeeShop.Latitude, coffeeShop.Longitude)
	if err != nil {
		log.Printf("Database error adding favorite: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully added coffee shop to favorites")

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Added to favorites",
	})
}

// removeFavorite removes a coffee shop from favorites
func (h *FavoritesHandler) removeFavorite(w http.ResponseWriter, r *http.Request, userID int) {
	placeID := r.URL.Query().Get("placeId")
	if placeID == "" {
		log.Printf("Missing required parameter: placeId")
		http.Error(w, "Place ID is required", http.StatusBadRequest)
		return
	}

	log.Printf("Removing coffee shop %s from favorites for user ID: %d", placeID, userID)

	rowsAffected, err := h.db.RemoveFavorite(userID, placeID)
	if err != nil {
		log.Printf("Database error removing favorite: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		log.Printf("Favorite not found: user ID %d, place ID %s", userID, placeID)
		http.Error(w, "Favorite not found", http.StatusNotFound)
		return
	}

	log.Printf("Successfully removed coffee shop from favorites")

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Removed from favorites",
	})
}
