package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
)

// Database connection
var db *sql.DB

// Structures for Google Places API
type PlacesRequest struct {
	IncludedTypes       []string            `json:"includedTypes"`
	MaxResultCount      int                 `json:"maxResultCount"`
	LocationRestriction LocationRestriction `json:"locationRestriction"`
}

type LocationRestriction struct {
	Circle Circle `json:"circle"`
}

type Circle struct {
	Center Center  `json:"center"`
	Radius float64 `json:"radius"`
}

type Center struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type PlacesResponse struct {
	Places []Place `json:"places"`
}

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
}

type CoffeeShopsResponse struct {
	CoffeeShops []CoffeeShop `json:"coffeeShops"`
}

type CoffeeShop struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	IsFavorite bool    `json:"isFavorite,omitempty"`
}

// User model
type User struct {
	ID        int       `json:"id"`
	ClerkID   string    `json:"clerkId"`
	Email     string    `json:"email"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// FavoriteCoffeeShop model
type FavoriteCoffeeShop struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	PlaceID   string    `json:"placeId"`
	Name      string    `json:"name"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	CreatedAt time.Time `json:"createdAt"`
}

// Clerk JWT claims
type ClerkClaims struct {
	UserId    string `json:"userId"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	jwt.RegisteredClaims
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize database
	initDB()

	// API routes
	http.HandleFunc("/coffee_shops", middlewareAuth(getCoffeeShops))
	http.HandleFunc("/user", middlewareAuth(handleUser))
	http.HandleFunc("/favorites", middlewareAuth(handleFavorites))
	http.HandleFunc("/visits", middlewareAuth(handleVisits))

	// Health check route (no auth required)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func initDB() {
	var err error

	// Get database connection details from environment variables
	// dbHost := os.Getenv("DB_HOST")
	// dbPort := os.Getenv("DB_PORT")
	// dbUser := os.Getenv("DB_USER")
	// dbPassword := os.Getenv("DB_PASSWORD")
	// dbName := os.Getenv("DB_NAME")

	// Create connection string
	connStr := os.Getenv("DB_CONNECTION_STRING")

	// Connect to database
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Successfully connected to database")
}

// Authentication middleware
func middlewareAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Skip auth for OPTIONS requests (CORS preflight)
		if r.Method == "OPTIONS" {
			next(w, r)
			return
		}

		// Get Clerk JWT token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		// Extract token from Bearer prefix
		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)

		// Verify token
		token, err := verifyClerkJWT(tokenString)
		if err != nil {
			http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Extract claims
		claims, ok := token.Claims.(*ClerkClaims)
		if !ok || !token.Valid {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// Ensure user exists in our database
		userID, err := ensureUserExists(claims)
		if err != nil {
			http.Error(w, "Error processing user: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Add user ID to request context
		r.Header.Set("X-User-ID", fmt.Sprintf("%d", userID))
		r.Header.Set("X-Clerk-ID", claims.UserId)

		// Call the next handler
		next(w, r)
	}
}

// Verify Clerk JWT token
func verifyClerkJWT(tokenString string) (*jwt.Token, error) {
	clerkJWTPubKey := os.Getenv("CLERK_JWT_PUBLIC_KEY")
	if clerkJWTPubKey == "" {
		return nil, fmt.Errorf("CLERK_JWT_PUBLIC_KEY environment variable is required")
	}

	// Parse and verify token
	token, err := jwt.ParseWithClaims(tokenString, &ClerkClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Parse PEM encoded public key
		publicKey, err := jwt.ParseRSAPublicKeyFromPEM([]byte(clerkJWTPubKey))
		if err != nil {
			return nil, err
		}

		return publicKey, nil
	})

	return token, err
}

// Ensure user exists in database or create a new one
func ensureUserExists(claims *ClerkClaims) (int, error) {
	var userID int

	// Check if user already exists
	err := db.QueryRow("SELECT id FROM users WHERE clerk_id = $1", claims.Subject).Scan(&userID)
	if err == nil {
		// User exists, return ID
		return userID, nil
	} else if err != sql.ErrNoRows {
		// Unexpected error
		return 0, err
	}

	// User doesn't exist, create new user
	err = db.QueryRow(
		"INSERT INTO users (clerk_id, email, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id",
		claims.Subject, claims.Email, claims.FirstName, claims.LastName,
	).Scan(&userID)

	if err != nil {
		return 0, err
	}

	return userID, nil
}

func getCoffeeShops(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from request header
	userIDStr := r.Header.Get("X-User-ID")
	userID, err := parseInt(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	latitude := 37.7937 // Default values
	longitude := -122.3965
	radius := 500.0
	maxResults := 10

	// Extract from query params if provided
	if lat := r.URL.Query().Get("lat"); lat != "" {
		fmt.Sscanf(lat, "%f", &latitude)
	}
	if lng := r.URL.Query().Get("lng"); lng != "" {
		fmt.Sscanf(lng, "%f", &longitude)
	}
	if rad := r.URL.Query().Get("radius"); rad != "" {
		fmt.Sscanf(rad, "%f", &radius)
	}
	if max := r.URL.Query().Get("max"); max != "" {
		fmt.Sscanf(max, "%d", &maxResults)
	}

	// Get API key from environment variable
	apiKey := os.Getenv("GOOGLE_PLACES_API_KEY")
	if apiKey == "" {
		http.Error(w, "GOOGLE_PLACES_API_KEY environment variable is required", http.StatusInternalServerError)
		return
	}

	// Prepare request to Google Places API
	requestBody := PlacesRequest{
		IncludedTypes:  []string{"cafe"},
		MaxResultCount: maxResults,
		LocationRestriction: LocationRestriction{
			Circle: Circle{
				Center: Center{
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
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		log.Printf("JSON marshal error: %v", err)
		return
	}

	// Create HTTP request to Google Places API
	req, err := http.NewRequest(
		"POST",
		"https://places.googleapis.com/v1/places:searchNearby",
		strings.NewReader(string(jsonData)),
	)
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		log.Printf("Request creation error: %v", err)
		return
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Goog-Api-Key", apiKey)
	req.Header.Set("X-Goog-FieldMask", "places.displayName,places.id,places.location")

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to fetch coffee shops", http.StatusInternalServerError)
		log.Printf("Request error: %v", err)
		return
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		http.Error(w, "Google Places API error", http.StatusInternalServerError)
		log.Printf("Google API error: %s, Status: %d", string(bodyBytes), resp.StatusCode)
		return
	}

	// Parse response
	var placesResp PlacesResponse
	if err := json.NewDecoder(resp.Body).Decode(&placesResp); err != nil {
		http.Error(w, "Failed to parse response", http.StatusInternalServerError)
		log.Printf("Response parsing error: %v", err)
		return
	}

	// Fetch user's favorites
	favoriteIDs, err := getUserFavorites(userID)
	if err != nil {
		log.Printf("Error fetching user favorites: %v", err)
		// Continue without favorites rather than failing
		favoriteIDs = make(map[string]bool)
	}

	// Extract coffee shop data
	var coffeeShops []CoffeeShop
	for _, place := range placesResp.Places {
		coffeeShop := CoffeeShop{
			ID:         place.PlaceID,
			Name:       place.DisplayName.Text,
			Latitude:   place.Location.Latitude,
			Longitude:  place.Location.Longitude,
			IsFavorite: favoriteIDs[place.PlaceID],
		}
		coffeeShops = append(coffeeShops, coffeeShop)
	}

	// Prepare our response
	response := CoffeeShopsResponse{
		CoffeeShops: coffeeShops,
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Get user's favorite coffee shop IDs
func getUserFavorites(userID int) (map[string]bool, error) {
	favorites := make(map[string]bool)

	rows, err := db.Query("SELECT place_id FROM favorite_coffee_shops WHERE user_id = $1", userID)
	if err != nil {
		return favorites, err
	}
	defer rows.Close()

	for rows.Next() {
		var placeID string
		if err := rows.Scan(&placeID); err != nil {
			return favorites, err
		}
		favorites[placeID] = true
	}

	return favorites, rows.Err()
}

// Handle user endpoints
func handleUser(w http.ResponseWriter, r *http.Request) {
	// Get user ID from request header
	userIDStr := r.Header.Get("X-User-ID")
	userID, err := parseInt(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getUserProfile(w, r, userID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// Get user profile
func getUserProfile(w http.ResponseWriter, r *http.Request, userID int) {
	var user User

	err := db.QueryRow(`
		SELECT id, clerk_id, email, first_name, last_name, created_at, updated_at 
		FROM users 
		WHERE id = $1
	`, userID).Scan(
		&user.ID, &user.ClerkID, &user.Email,
		&user.FirstName, &user.LastName,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
			log.Printf("Database error: %v", err)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// Handle favorites endpoints
func handleFavorites(w http.ResponseWriter, r *http.Request) {
	// Get user ID from request header
	userIDStr := r.Header.Get("X-User-ID")
	userID, err := parseInt(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getFavorites(w, r, userID)
	case http.MethodPost:
		addFavorite(w, r, userID)
	case http.MethodDelete:
		removeFavorite(w, r, userID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// Get user's favorite coffee shops
func getFavorites(w http.ResponseWriter, r *http.Request, userID int) {
	favorites := []CoffeeShop{}

	rows, err := db.Query(`
		SELECT place_id, name, latitude, longitude 
		FROM favorite_coffee_shops 
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Printf("Database error: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var shop CoffeeShop
		shop.IsFavorite = true

		if err := rows.Scan(&shop.ID, &shop.Name, &shop.Latitude, &shop.Longitude); err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			log.Printf("Row scan error: %v", err)
			return
		}

		favorites = append(favorites, shop)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Printf("Rows error: %v", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"favorites": favorites,
	})
}

// Add a coffee shop to favorites
func addFavorite(w http.ResponseWriter, r *http.Request, userID int) {
	var coffeeShop CoffeeShop

	if err := json.NewDecoder(r.Body).Decode(&coffeeShop); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if coffeeShop.ID == "" || coffeeShop.Name == "" {
		http.Error(w, "Place ID and Name are required", http.StatusBadRequest)
		return
	}

	_, err := db.Exec(`
		INSERT INTO favorite_coffee_shops (user_id, place_id, name, latitude, longitude) 
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id, place_id) DO NOTHING
	`, userID, coffeeShop.ID, coffeeShop.Name, coffeeShop.Latitude, coffeeShop.Longitude)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			// Duplicate key violation (already favorite)
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Already in favorites",
			})
			return
		}

		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Printf("Database error: %v", err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Added to favorites",
	})
}

// Remove a coffee shop from favorites
func removeFavorite(w http.ResponseWriter, r *http.Request, userID int) {
	placeID := r.URL.Query().Get("placeId")
	if placeID == "" {
		http.Error(w, "Place ID is required", http.StatusBadRequest)
		return
	}

	result, err := db.Exec(`
		DELETE FROM favorite_coffee_shops 
		WHERE user_id = $1 AND place_id = $2
	`, userID, placeID)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Printf("Database error: %v", err)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Favorite not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Removed from favorites",
	})
}

// Handle visits endpoints
func handleVisits(w http.ResponseWriter, r *http.Request) {
	// Get user ID from request header
	userIDStr := r.Header.Get("X-User-ID")
	userID, err := parseInt(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getVisits(w, r, userID)
	case http.MethodPost:
		addVisit(w, r, userID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// Get user's visits
func getVisits(w http.ResponseWriter, r *http.Request, userID int) {
	rows, err := db.Query(`
		SELECT place_id, name, visited_at 
		FROM visits 
		WHERE user_id = $1
		ORDER BY visited_at DESC
		LIMIT 50
	`, userID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Printf("Database error: %v", err)
		return
	}
	defer rows.Close()

	type Visit struct {
		PlaceID   string    `json:"placeId"`
		Name      string    `json:"name"`
		VisitedAt time.Time `json:"visitedAt"`
	}

	visits := []Visit{}

	for rows.Next() {
		var visit Visit
		if err := rows.Scan(&visit.PlaceID, &visit.Name, &visit.VisitedAt); err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			log.Printf("Row scan error: %v", err)
			return
		}
		visits = append(visits, visit)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Printf("Rows error: %v", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"visits": visits,
	})
}

// Add a visit
func addVisit(w http.ResponseWriter, r *http.Request, userID int) {
	var coffeeShop CoffeeShop

	if err := json.NewDecoder(r.Body).Decode(&coffeeShop); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if coffeeShop.ID == "" || coffeeShop.Name == "" {
		http.Error(w, "Place ID and Name are required", http.StatusBadRequest)
		return
	}

	_, err := db.Exec(`
		INSERT INTO visits (user_id, place_id, name) 
		VALUES ($1, $2, $3)
	`, userID, coffeeShop.ID, coffeeShop.Name)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Printf("Database error: %v", err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Visit recorded",
	})
}

// Helper function to parse string to int
func parseInt(s string) (int, error) {
	var i int
	if s == "" {
		return 0, fmt.Errorf("empty string")
	}
	_, err := fmt.Sscanf(s, "%d", &i)
	return i, err
}
