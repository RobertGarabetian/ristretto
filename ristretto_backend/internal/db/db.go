package db

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq" // PostgreSQL driver
)

// DB is a wrapper around sql.DB with additional methods
type DB struct {
	*sql.DB
}

// Connect establishes a connection to the database
func Connect(connStr string) (*DB, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		return nil, err
	}

	log.Println("Successfully connected to database")
	return &DB{db}, nil
}

// GetUserByClerkID retrieves a user by their Clerk ID
func (db *DB) GetUserByClerkID(clerkID string) (int, error) {
	var userID int
	err := db.QueryRow("SELECT id FROM users WHERE clerk_id = $1", clerkID).Scan(&userID)
	return userID, err
}

// CreateUser creates a new user in the database
func (db *DB) CreateUser(clerkID, email, firstName, lastName string) (int, error) {
	var userID int
	err := db.QueryRow(
		"INSERT INTO users (clerk_id, email, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id",
		clerkID, email, firstName, lastName,
	).Scan(&userID)
	return userID, err
}

// GetUserFavorites retrieves a user's favorite coffee shop IDs
func (db *DB) GetUserFavorites(userID int) (map[string]bool, error) {
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

// GetUserProfile retrieves a user's profile information
func (db *DB) GetUserProfile(userID int) (map[string]interface{}, error) {
	var (
		id        int
		clerkID   string
		email     string
		firstName string
		lastName  string
		createdAt string
		updatedAt string
	)

	err := db.QueryRow(`
		SELECT id, clerk_id, email, first_name, last_name, created_at, updated_at 
		FROM users 
		WHERE id = $1
	`, userID).Scan(
		&id, &clerkID, &email,
		&firstName, &lastName,
		&createdAt, &updatedAt,
	)

	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":        id,
		"clerkId":   clerkID,
		"email":     email,
		"firstName": firstName,
		"lastName":  lastName,
		"createdAt": createdAt,
		"updatedAt": updatedAt,
	}, nil
}

// GetFavorites retrieves a user's favorite coffee shops
func (db *DB) GetFavorites(userID int) ([]map[string]interface{}, error) {
	favorites := []map[string]interface{}{}

	rows, err := db.Query(`
		SELECT place_id, name, latitude, longitude 
		FROM favorite_coffee_shops 
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return favorites, err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			placeID   string
			name      string
			latitude  float64
			longitude float64
		)

		if err := rows.Scan(&placeID, &name, &latitude, &longitude); err != nil {
			return favorites, err
		}

		favorites = append(favorites, map[string]interface{}{
			"id":         placeID,
			"name":       name,
			"latitude":   latitude,
			"longitude":  longitude,
			"isFavorite": true,
		})
	}

	return favorites, rows.Err()
}

// AddFavorite adds a coffee shop to a user's favorites
func (db *DB) AddFavorite(userID int, placeID, name string, latitude, longitude float64) error {
	_, err := db.Exec(`
		INSERT INTO favorite_coffee_shops (user_id, place_id, name, latitude, longitude) 
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id, place_id) DO NOTHING
	`, userID, placeID, name, latitude, longitude)
	return err
}

// RemoveFavorite removes a coffee shop from a user's favorites
func (db *DB) RemoveFavorite(userID int, placeID string) (int64, error) {
	result, err := db.Exec(`
		DELETE FROM favorite_coffee_shops 
		WHERE user_id = $1 AND place_id = $2
	`, userID, placeID)

	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

// GetVisits retrieves a user's coffee shop visits
func (db *DB) GetVisits(userID int) ([]map[string]interface{}, error) {
	visits := []map[string]interface{}{}

	rows, err := db.Query(`
		SELECT place_id, name, visited_at 
		FROM visits 
		WHERE user_id = $1
		ORDER BY visited_at DESC
		LIMIT 50
	`, userID)
	if err != nil {
		return visits, err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			placeID   string
			name      string
			visitedAt string
		)

		if err := rows.Scan(&placeID, &name, &visitedAt); err != nil {
			return visits, err
		}

		visits = append(visits, map[string]interface{}{
			"placeId":   placeID,
			"name":      name,
			"visitedAt": visitedAt,
		})
	}

	return visits, rows.Err()
}

// AddVisit records a visit to a coffee shop
func (db *DB) AddVisit(userID int, placeID, name string) error {
	_, err := db.Exec(`
		INSERT INTO visits (user_id, place_id, name) 
		VALUES ($1, $2, $3)
	`, userID, placeID, name)
	return err
}
