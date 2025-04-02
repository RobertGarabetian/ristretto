package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/models"
)

// PlacesService interacts with the Google Places API
type PlacesService struct {
	APIKey string
}

// NewPlacesService creates a new PlacesService
func NewPlacesService(apiKey string) *PlacesService {
	return &PlacesService{
		APIKey: apiKey,
	}
}

// SearchNearby searches for coffee shops near a location
func (s *PlacesService) SearchNearby(latitude, longitude, radius float64, maxResults int) ([]models.Place, error) {
	log.Printf("Making request to Google Places API with coords: %f, %f, radius: %f", latitude, longitude, radius)
	apiKey := s.APIKey
	log.Printf("Google Places API Key present: %v (length: %d)", apiKey != "", len(apiKey))

	// Prepare request to Google Places API
	requestBody := models.PlacesRequest{
		IncludedTypes:  []string{"cafe"},
		MaxResultCount: maxResults,
		LocationRestriction: models.LocationRestriction{
			Circle: models.Circle{
				Center: models.Center{
					Latitude:  latitude,
					Longitude: longitude,
				},
				Radius: radius,
			},
		},
	}

	// Convert request to JSON
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		log.Printf("JSON marshal error: %v", err)
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Create HTTP request to Google Places API
	req, err := http.NewRequest(
		"POST",
		"https://places.googleapis.com/v1/places:searchNearby",
		strings.NewReader(string(jsonData)),
	)
	if err != nil {
		log.Printf("Request creation error: %v", err)
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Goog-Api-Key", apiKey)
	req.Header.Set("X-Goog-FieldMask", "places.displayName,places.id,places.location,places.photos")

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("ERROR: Failed to connect to Google Places API: %v", err)
		return nil, fmt.Errorf("failed to fetch coffee shops: %w", err)
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
	var placesResp models.PlacesResponse
	if err := json.NewDecoder(resp.Body).Decode(&placesResp); err != nil {
		log.Printf("Response parsing error: %v", err)
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	log.Printf("Successfully parsed Google Places API response with %d places", len(placesResp.Places))

	return placesResp.Places, nil
}
