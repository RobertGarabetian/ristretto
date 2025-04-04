package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/db"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/models"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/services"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/pkg/utils"
)

// CoffeeShopDetailsHandler handles requests for coffee shop details
type CoffeeShopDetailsHandler struct {
	db            *db.DB
	placesService *services.PlacesService
}

// NewCoffeeShopDetailsHandler creates a new CoffeeShopDetailsHandler
func NewCoffeeShopDetailsHandler(db *db.DB, placesService *services.PlacesService) *CoffeeShopDetailsHandler {
	return &CoffeeShopDetailsHandler{
		db:            db,
		placesService: placesService,
	}
}

// HandleCoffeeShopDetails handles GET requests for a specific coffee shop's details
func (h *CoffeeShopDetailsHandler) HandleCoffeeShopDetails(w http.ResponseWriter, r *http.Request) {
	log.Printf("getCoffeeShopDetails handler called: %s %s", r.Method, r.URL.String())

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

	// Extract place ID from URL path
	// URL path format: /coffee_shops/{place_id}
	placeID := r.URL.Path[len("/coffee_shops/"):]
	if placeID == "" {
		log.Printf("ERROR: Missing place ID in request")
		http.Error(w, "Place ID is required", http.StatusBadRequest)
		return
	}
	log.Printf("Place ID extracted: %s", placeID)

	// Fetch coffee shop details from Google Places API
	placeDetails, err := h.placesService.GetPlaceDetails(placeID)
	if err != nil {
		log.Printf("ERROR: Failed to fetch coffee shop details: %v", err)

		// Return mock data for development if Google Places API fails
		if isDevEnvironment() {
			log.Println("Development environment detected, returning mock details")
			mockResponse := createMockCoffeeShopDetails(placeID)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(mockResponse)
			return
		}

		http.Error(w, "Failed to fetch coffee shop details", http.StatusInternalServerError)
		return
	}

	// Check if this coffee shop is in the user's favorites
	favoriteIDs, err := h.db.GetUserFavorites(userID)
	fmt.Print(":::::::::::::::::::::::::::::\n")
	if err != nil {
		log.Printf("Error fetching user favorites: %v", err)
		// Continue without favorites rather than failing
		favoriteIDs = make(map[string]bool)
	}
	fmt.Print(placeDetails)
	/* CLAUDE I THINK I AM HAVING AN ISSUE RIGHT HERE WHEN I TRY TO CONVERT
	THE PLACEDETAILS TO COFFEESHOPDETAILS. */
	// Convert PlaceDetails to CoffeeShopDetails
	coffeeShopDetails := models.CoffeeShopDetails{
		ID:           placeDetails.PlaceID,
		Name:         placeDetails.DisplayName.Text,
		Latitude:     placeDetails.Location.Latitude,
		Longitude:    placeDetails.Location.Longitude,
		Address:      placeDetails.FormattedAddress,
		PhoneNumber:  placeDetails.InternationalPhoneNumber,
		Website:      placeDetails.WebsiteURI,
		IsFavorite:   favoriteIDs[placeID],
		OpeningHours: formatOpeningHours(placeDetails.CurrentOpeningHours),
		Photos:       formatPhotos(placeDetails.Photos),
	}

	fmt.Print("----------------------------\n\n")

	// Prepare our response
	response := models.CoffeeShopDetailsResponse{
		CoffeeShop: coffeeShopDetails,
	}

	log.Printf("Sending response with coffee shop details for: %s", placeDetails.DisplayName.Text)

	// Send response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("ERROR: Failed to encode response: %v", err)
	}
}

// formatOpeningHours converts Google Places API opening hours to our format
func formatOpeningHours(openingHours *models.OpeningHours) []string {
	if openingHours == nil || len(openingHours.Periods) == 0 {
		return nil
	}

	days := []string{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}
	formattedHours := make([]string, 0, len(days))

	for i, day := range days {
		dayIndex := i + 1 // Google uses 0 for Sunday, we're using 0 for Monday
		if dayIndex == 7 {
			dayIndex = 0 // Convert our Sunday to Google's Sunday
		}

		found := false
		for _, period := range openingHours.Periods {
			if period.Open.Day == dayIndex {
				close := "24:00"
				if period.Close != nil {
					close = period.Close.Time[:2] + ":" + period.Close.Time[2:]
				}
				open := period.Open.Time[:2] + ":" + period.Open.Time[2:]
				formattedHours = append(formattedHours, day+": "+open+" - "+close)
				found = true
				break
			}
		}

		if !found {
			formattedHours = append(formattedHours, day+": Closed")
		}
	}

	return formattedHours
}

// formatPhotos converts Google Places API photos to our format
func formatPhotos(photos []*models.Photo) []string {
	if len(photos) == 0 {
		return nil
	}

	photoUrls := make([]string, 0, len(photos))
	for _, photo := range photos {
		if photo.Name != "" {
			// We don't actually construct URLs here since we'd need to make additional API calls
			// In a real implementation, you might want to use the Places Photos API
			// For now, we'll just store the photo reference which the frontend can use
			photoUrls = append(photoUrls, photo.Name)
		}
	}

	return photoUrls
}

// createMockCoffeeShopDetails creates mock coffee shop details for development
func createMockCoffeeShopDetails(placeID string) models.CoffeeShopDetailsResponse {
	return models.CoffeeShopDetailsResponse{
		CoffeeShop: models.CoffeeShopDetails{
			ID:          placeID,
			Name:        "Café Sunrise",
			Latitude:    37.7937,
			Longitude:   -122.3965,
			Address:     "123 Coffee Street, San Francisco, CA 94107",
			PhoneNumber: "+1 (415) 555-1234",
			Website:     "https://example.com/coffee",
			Rating:      4.5,
			IsFavorite:  false,
			PriceLevel:  2,
			OpeningHours: []string{
				"Monday: 7:00 - 19:00",
				"Tuesday: 7:00 - 19:00",
				"Wednesday: 7:00 - 19:00",
				"Thursday: 7:00 - 19:00",
				"Friday: 7:00 - 20:00",
				"Saturday: 8:00 - 20:00",
				"Sunday: 8:00 - 18:00",
			},
			Photos: []string{"/placeholder.svg?height=400&width=800"},
		},
	}
}
