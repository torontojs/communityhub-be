#!/bin/bash

# Base URL of your API
BASE_URL="http://localhost:8787"

# Create Team (POST)
echo "Creating a new resource..."
curl -X POST "$BASE_URL/sql/teams" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Team",
    "happenedAt": "2025-01-20T10:00:00Z",
    "description": "This is a new resource."
  }'

# Read (GET) and pretty-print the response using jq
echo "Fetching a resource..."
curl -X GET "$BASE_URL/sql/teams" \
  -H "Content-Type: application/json" | jq .

# How to use test file

# chmod +x curl-tests.sh
# sudo apt-get install jq
# ./curl-tests.sh


