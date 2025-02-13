#!/bin/bash

# Directly use the credentials for authentication
curl -X POST http://localhost:8787/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "profile4@example.com",
    "password": "password4",
	"name":"Ken BooBoo"
  }'
