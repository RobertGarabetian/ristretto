package utils

import (
	"fmt"
	"strconv"
)

// ParseInt parses a string into an integer
func ParseInt(s string) (int, error) {
	if s == "" {
		return 0, fmt.Errorf("empty string")
	}

	return strconv.Atoi(s)
}

// SetJSONContentType sets the Content-Type header to application/json
func SetJSONContentType(headers map[string][]string) {
	headers["Content-Type"] = []string{"application/json"}
}

// ContainsString checks if a string is in a slice of strings
func ContainsString(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
