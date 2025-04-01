package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// User represents a user in our application
type User struct {
	ID        int       `json:"id"`
	ClerkID   string    `json:"clerkId"`
	Email     string    `json:"email"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// ClerkClaims represents the claims in a Clerk JWT
type ClerkClaims struct {
	UserId    string `json:"userId"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	jwt.RegisteredClaims
}
