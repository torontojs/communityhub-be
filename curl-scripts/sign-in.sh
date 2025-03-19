curl -i -X POST http://localhost:8787/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "profile1@example.com",
    "password": "abcd"
  }'
