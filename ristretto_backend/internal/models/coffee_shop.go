package models

// CoffeeShop represents a coffee shop in our application
type CoffeeShop struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	Photos     string  `json:"photos"`
	IsFavorite bool    `json:"isFavorite,omitempty"`
}

// CoffeeShopsResponse represents the response for the coffee shops endpoint
type CoffeeShopsResponse struct {
	CoffeeShops []CoffeeShop `json:"coffeeShops"`
}

// FavoriteCoffeeShop represents a favorite coffee shop stored in the database
type FavoriteCoffeeShop struct {
	ID        int     `json:"id"`
	UserID    int     `json:"userId"`
	PlaceID   string  `json:"placeId"`
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// Visit represents a visit to a coffee shop
type Visit struct {
	PlaceID   string `json:"placeId"`
	Name      string `json:"name"`
	VisitedAt string `json:"visitedAt"`
}
