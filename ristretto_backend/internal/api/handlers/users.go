package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/db"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/pkg/utils"
)

// UserHandler handles user-related requests
type UserHandler struct {
	db *db.DB
}

// NewUserHandler creates a new UserHandler
func NewUserHandler(db *db.DB) *UserHandler {
	return &UserHandler{
		db: db,
	}
}

// HandleUser handles requests to the /user endpoint
func (h *UserHandler) HandleUser(w http.ResponseWriter, r *http.Request) {
	// Get user ID from request header
	userIDStr := r.Header.Get("X-User-ID")
	userID, err := utils.ParseInt(userIDStr)
	if err != nil {
		log.Printf("Invalid user ID: %s", userIDStr)
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	log.Printf("Handling user request: %s for user ID: %d", r.Method, userID)

	switch r.Method {
	case http.MethodGet:
		h.getUserProfile(w, r, userID)
	default:
		log.Printf("Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// getUserProfile gets a user's profile
func (h *UserHandler) getUserProfile(w http.ResponseWriter, r *http.Request, userID int) {
	log.Printf("Getting profile for user ID: %d", userID)

	profile, err := h.db.GetUserProfile(userID)
	if err != nil {
		log.Printf("Error getting user profile: %v", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	log.Printf("Successfully retrieved profile for user ID: %d", userID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}
