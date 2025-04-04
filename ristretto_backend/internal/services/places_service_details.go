package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/models"
)

// GetPlaceDetails fetches detailed information about a place from the Google Places API
func (s *PlacesService) GetPlaceDetails(placeID string) (*models.PlaceDetails, error) {
	log.Printf("Fetching details for place ID: %s", placeID)
	apiKey := s.APIKey

	if apiKey == "" {
		return nil, fmt.Errorf("Google Places API key is required")
	}

	// Create HTTP request to Google Places API
	url := fmt.Sprintf("https://places.googleapis.com/v1/places/%s", placeID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Printf("Request creation error: %v", err)
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Goog-Api-Key", apiKey)
	req.Header.Set("X-Goog-FieldMask", "id,displayName,formattedAddress,location,googleMapsUri,websiteUri,internationalPhoneNumber,currentOpeningHours,photos")

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("ERROR: Failed to connect to Google Places API: %v", err)
		return nil, fmt.Errorf("failed to fetch place details: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("Google Places API response received with status: %d", resp.StatusCode)

	// Check response status
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Google API error: %s, Status: %d", string(bodyBytes), resp.StatusCode)
		return nil, fmt.Errorf("Google Places API error: %s", string(bodyBytes))
	}

	// Parse response
	var placeDetails models.PlaceDetails
	if err := json.NewDecoder(resp.Body).Decode(&placeDetails); err != nil {
		log.Printf("Response parsing error: %v", err)
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	log.Printf("Successfully parsed Google Places API details response for: %s", placeDetails.DisplayName.Text)

	return &placeDetails, nil
}
