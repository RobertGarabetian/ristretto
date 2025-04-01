package config

import "os"

// Config holds all configuration for the application
type Config struct {
	Database   DatabaseConfig
	Google     GoogleConfig
	Auth       AuthConfig
	ServerPort string
}

// DatabaseConfig holds database connection information
type DatabaseConfig struct {
	ConnectionString string
}

// GoogleConfig holds Google API configuration
type GoogleConfig struct {
	PlacesAPIKey string
}

// AuthConfig holds authentication configuration
type AuthConfig struct {
	ClerkJWTPublicKey string
}

// Load returns the application configuration from environment variables
func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		Database: DatabaseConfig{
			ConnectionString: os.Getenv("DB_CONNECTION_STRING"),
		},
		Google: GoogleConfig{
			PlacesAPIKey: os.Getenv("GOOGLE_PLACES_API_KEY"),
		},
		Auth: AuthConfig{
			ClerkJWTPublicKey: os.Getenv("CLERK_JWT_PUBLIC_KEY"),
		},
		ServerPort: port,
	}
}
