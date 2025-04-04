package services

import (
	"fmt"
	"log"
	"net/url"
)

// PhotoSize specifies the desired size for a photo
type PhotoSize struct {
	MaxWidthPx  int
	MaxHeightPx int
}

// GetPhotoURL generates a URL to fetch a photo from the Google Places API
func (s *PlacesService) GetPhotoURL(photoName string, size PhotoSize) string {
	if photoName == "" {
		log.Println("WARNING: Empty photo name provided")
		return ""
	}

	// Base URL for the Places Photos API
	baseURL := "https://places.googleapis.com/v1/"

	// Create URL with parameters
	photoURL := fmt.Sprintf("%s%s/media", baseURL, photoName)

	// Add parameters
	params := url.Values{}
	params.Add("key", s.APIKey)

	// Add size parameters
	if size.MaxWidthPx > 0 {
		params.Add("maxWidthPx", fmt.Sprintf("%d", size.MaxWidthPx))
	}
	if size.MaxHeightPx > 0 {
		params.Add("maxHeightPx", fmt.Sprintf("%d", size.MaxHeightPx))
	}

	// If neither width nor height specified, use a default
	if size.MaxWidthPx <= 0 && size.MaxHeightPx <= 0 {
		params.Add("maxWidthPx", "400")
	}

	// Combine URL and parameters
	return photoURL + "?" + params.Encode()
}

// TransformPhotoURLs converts photo resource names to actual URLs
func (s *PlacesService) TransformPhotoURLs(photoNames []string, size PhotoSize) []string {
	if len(photoNames) == 0 {
		return nil
	}

	photoURLs := make([]string, 0, len(photoNames))
	for _, name := range photoNames {
		if url := s.GetPhotoURL(name, size); url != "" {
			photoURLs = append(photoURLs, url)
		}
	}

	return photoURLs
}
