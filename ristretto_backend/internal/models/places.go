package models

// PlacesRequest represents a request to the Google Places API
type PlacesRequest struct {
	IncludedTypes       []string            `json:"includedTypes"`
	MaxResultCount      int                 `json:"maxResultCount"`
	LocationRestriction LocationRestriction `json:"locationRestriction"`
}

// LocationRestriction defines the area to search in
type LocationRestriction struct {
	Circle Circle `json:"circle"`
}

// Circle defines a circular area
type Circle struct {
	Center Center  `json:"center"`
	Radius float64 `json:"radius"`
}

// Center defines the center point of a circle
type Center struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// PlacesResponse represents a response from the Google Places API
type PlacesResponse struct {
	Places []Place `json:"places"`
}

// Place represents a place in the Google Places API
type Place struct {
	Name        string `json:"name"`
	PlaceID     string `json:"id"`
	DisplayName struct {
		Text string `json:"text"`
	} `json:"displayName"`
	Location struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	} `json:"location"`
	Photos string `json:"photos"`
}
