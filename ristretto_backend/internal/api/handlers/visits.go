package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/db"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/internal/models"
	"github.com/RobertGarabetian/ristretto/ristretto_backend/pkg/utils"
)

// VisitsHandler handles requests for visit records
type VisitsHandler struct {
	db *db.DB
}

// NewVisitsHandler creates a new VisitsHandler
func NewVisitsHandler(db *db.DB) *VisitsHandler {
	return &VisitsHandler{
		db: db,
	}
}

// HandleVisits handles requests to the /visits endpoint
func (h *VisitsHandler) HandleVisits(w http.ResponseWriter, r *http.Request) {
	// Get user ID from request header
	userIDStr := r.Header.Get("X-User-ID")
	userID, err := utils.ParseInt(userIDStr)
	if err != nil {
		log.Printf("Invalid user ID: %s", userIDStr)
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	log.Printf("Handling visits request: %s for user ID: %d", r.Method, userID)

	switch r.Method {
	case http.MethodGet:
		h.getVisits(w, r, userID)
	case http.MethodPost:
		h.addVisit(w, r, userID)
	default:
		log.Printf("Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// getVisits gets a user's visit history
func (h *VisitsHandler) getVisits(w http.ResponseWriter, r *http.Request, userID int) {
	log.Printf("Getting visit history for user ID: %d", userID)

	visits, err := h.db.GetVisits(userID)
	if err != nil {
		log.Printf("Database error fetching visits: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	log.Printf("Found %d visits for user ID: %d", len(visits), userID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"visits": visits,
	})
}

// addVisit records a coffee shop visit
func (h *VisitsHandler) addVisit(w http.ResponseWriter, r *http.Request, userID int) {
	var coffeeShop models.CoffeeShop

	if err := json.NewDecoder(r.Body).Decode(&coffeeShop); err != nil {
		log.Printf("Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if coffeeShop.ID == "" || coffeeShop.Name == "" {
		log.Printf("Missing required fields: ID or Name")
		http.Error(w, "Place ID and Name are required", http.StatusBadRequest)
		return
	}

	log.Printf("Recording visit to %s (%s) for user ID: %d",
		coffeeShop.Name, coffeeShop.ID, userID)

	err := h.db.AddVisit(userID, coffeeShop.ID, coffeeShop.Name)
	if err != nil {
		log.Printf("Database error recording visit: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully recorded visit")

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Visit recorded",
	})
}
