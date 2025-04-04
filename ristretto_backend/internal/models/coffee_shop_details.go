package models

// CoffeeShopDetails represents detailed information about a coffee shop
type CoffeeShopDetails struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Latitude     float64  `json:"latitude"`
	Longitude    float64  `json:"longitude"`
	Address      string   `json:"address,omitempty"`
	PhoneNumber  string   `json:"phoneNumber,omitempty"`
	Website      string   `json:"website,omitempty"`
	Rating       float64  `json:"rating,omitempty"`
	IsFavorite   bool     `json:"isFavorite"`
	PriceLevel   int      `json:"priceLevel,omitempty"`
	OpeningHours []string `json:"openingHours,omitempty"`
	Photos       []string `json:"photos,omitempty"`
}

// CoffeeShopDetailsResponse represents the response for the coffee shop details endpoint
type CoffeeShopDetailsResponse struct {
	CoffeeShop CoffeeShopDetails `json:"coffeeShop"`
}

// PlaceDetails represents the response from the Google Places API for a place details request
type PlaceDetails struct {
	PlaceID                  string        `json:"id"`
	DisplayName              DisplayName   `json:"displayName"`
	FormattedAddress         string        `json:"formattedAddress,omitempty"`
	Location                 Location      `json:"location"`
	GoogleMapsURI            string        `json:"googleMapsUri,omitempty"`
	WebsiteURI               string        `json:"websiteUri,omitempty"`
	InternationalPhoneNumber string        `json:"internationalPhoneNumber,omitempty"`
	Rating                   float64       `json:"rating,omitempty"`
	PriceLevel               int           `json:"priceLevel,omitempty"`
	CurrentOpeningHours      *OpeningHours `json:"currentOpeningHours,omitempty"`
	Photos                   []*Photo      `json:"photos,omitempty"`
}

// OpeningHours represents opening hours information from the Google Places API
type OpeningHours struct {
	OpenNow bool           `json:"openNow"`
	Periods []*HoursPeriod `json:"periods"`
}

// DisplayName holds the display name text for a place
type DisplayName struct {
	Text string `json:"text"`
}

// Location represents geographical coordinates
type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// HoursPeriod represents a period of opening hours
type HoursPeriod struct {
	Open  *TimeOfDay `json:"open"`
	Close *TimeOfDay `json:"close,omitempty"` // Close can be nil for 24-hour venues
}

// TimeOfDay represents a time of day with day of week
type TimeOfDay struct {
	Day  int    `json:"day"`  // 0 Sunday - 6 Saturday
	Time string `json:"time"` // HHmm format, e.g. "0900"
}

// Photo represents a photo from the Google Places API
type Photo struct {
	Name        string `json:"name"`
	Attribution string `json:"authorAttribution,omitempty"`
}
