package middleware

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"

	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/db"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/models"
)

// Auth middleware authenticates requests using Clerk JWT tokens
func Auth(db *db.DB, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Request received: %s %s", r.Method, r.URL.Path)

		// Skip auth for OPTIONS requests (CORS preflight)
		if r.Method == "OPTIONS" {
			log.Println("CORS preflight request detected, skipping auth")
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.WriteHeader(http.StatusOK)
			return
		}

		// Set CORS headers for all responses
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Get Clerk JWT token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			log.Println("ERROR: Missing Authorization header")
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		// Log if the header format is as expected
		if !strings.HasPrefix(authHeader, "Bearer ") {
			log.Printf("WARNING: Authorization header does not start with 'Bearer ': %s", authHeader[:10])
		} else {
			log.Printf("Authorization header present with Bearer prefix (length: %d)", len(authHeader))
		}

		// Extract token from Bearer prefix
		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		log.Printf("Token extracted (length: %d)", len(tokenString))

		// Verify token
		claims, err := verifyClerkJWT(tokenString)
		if err != nil {
			log.Printf("ERROR: Token verification failed: %v", err)
			http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
			return
		}
		log.Println("Token successfully verified")
		log.Printf("Claims extracted - User: %s, Email: %s", claims.UserId, claims.Email)

		// Ensure user exists in our database
		userID, err := ensureUserExists(db, claims)
		if err != nil {
			log.Printf("ERROR: Failed to ensure user exists: %v", err)
			http.Error(w, "Error processing user: "+err.Error(), http.StatusInternalServerError)
			return
		}
		log.Printf("User exists in database with ID: %d", userID)

		// Add user ID to request context
		r.Header.Set("X-User-ID", fmt.Sprintf("%d", userID))
		r.Header.Set("X-Clerk-ID", claims.UserId)
		log.Println("Added user ID to request headers")

		// Call the next handler
		log.Println("Authentication successful, proceeding to handler")
		next(w, r)
	}
}

// verifyClerkJWT verifies a Clerk JWT and returns the claims
func verifyClerkJWT(tokenString string) (*models.ClerkClaims, error) {
	log.Println("Starting JWT verification")

	clerkJWTPubKey := os.Getenv("CLERK_JWT_PUBLIC_KEY")
	if clerkJWTPubKey == "" {
		log.Println("ERROR: CLERK_JWT_PUBLIC_KEY environment variable is missing")
		return nil, fmt.Errorf("CLERK_JWT_PUBLIC_KEY environment variable is required")
	}
	log.Printf("Public key loaded (length: %d)", len(clerkJWTPubKey))

	// Parse and verify token
	claims := &models.ClerkClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			log.Printf("ERROR: Unexpected signing method: %v", token.Header["alg"])
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		log.Printf("Token alg: %v", token.Header["alg"])

		// Parse PEM encoded public key
		publicKey, err := jwt.ParseRSAPublicKeyFromPEM([]byte(clerkJWTPubKey))
		if err != nil {
			log.Printf("ERROR: Failed to parse RSA public key: %v", err)
			return nil, err
		}
		log.Println("Successfully parsed RSA public key")

		return publicKey, nil
	})

	if err != nil {
		log.Printf("ERROR: JWT parsing failed: %v", err)
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	log.Println("JWT successfully parsed and verified")
	return claims, nil
}

// ensureUserExists ensures that a user exists in the database
func ensureUserExists(db *db.DB, claims *models.ClerkClaims) (int, error) {
	log.Printf("Ensuring user exists for ClerkID: %s", claims.Subject)

	// Check if user already exists
	userID, err := db.GetUserByClerkID(claims.Subject)
	if err == nil {
		// User exists, return ID
		log.Printf("User found in database with ID: %d", userID)
		return userID, nil
	} else if err != sql.ErrNoRows {
		// Unexpected error
		log.Printf("ERROR: Database query failed: %v", err)
		return 0, err
	}

	log.Printf("User not found, creating new user with email: %s", claims.Email)

	// User doesn't exist, create new user
	userID, err = db.CreateUser(claims.Subject, claims.Email, claims.FirstName, claims.LastName)
	if err != nil {
		log.Printf("ERROR: Failed to create user: %v", err)
		return 0, err
	}

	log.Printf("New user created with ID: %d", userID)
	return userID, nil
}
