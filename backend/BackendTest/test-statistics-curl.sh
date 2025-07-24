#!/bin/bash

echo "🔐 Logging in..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"willy4opera@gmail.com","password":"Wind@wswil24d"}')

TOKEN=$(echo $RESPONSE | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to get token"
  echo "Response: $RESPONSE"
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:20}..."

echo -e "\n📊 Fetching statistics report..."
curl -X GET http://localhost:5000/api/v1/statistics/report \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
