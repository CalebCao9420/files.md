package server

import "strings"

func Merge(s1, s2 string) string {
	// If one string is a prefix of the other, return the longer one
	if strings.HasPrefix(s2, s1) {
		return s2
	}
	if strings.HasPrefix(s1, s2) {
		return s1
	}

	// If one string is a suffix of the other, return the longer one
	if strings.HasSuffix(s2, s1) {
		return s2
	}
	if strings.HasSuffix(s1, s2) {
		return s1
	}

	// Otherwise, perform a line-by-line merge
	originalLines := strings.Split(s1, "\n")
	modifiedLines := strings.Split(s2, "\n")

	// Find the common prefix of lines
	var commonPrefixLength int
	for commonPrefixLength < len(originalLines) &&
		commonPrefixLength < len(modifiedLines) &&
		originalLines[commonPrefixLength] == modifiedLines[commonPrefixLength] {
		commonPrefixLength++
	}

	// Create a set of lines from both files after the common prefix
	uniqueLines := make(map[string]bool)
	for i := commonPrefixLength; i < len(originalLines); i++ {
		if originalLines[i] != "" {
			uniqueLines[originalLines[i]] = true
		}
	}
	for i := commonPrefixLength; i < len(modifiedLines); i++ {
		if modifiedLines[i] != "" {
			uniqueLines[modifiedLines[i]] = true
		}
	}

	// Build the result: common prefix + all unique lines
	result := strings.Join(originalLines[:commonPrefixLength], "\n")

	// Add the unique lines
	for line := range uniqueLines {
		result += "\n" + line
	}

	return result
}
