#!/bin/bash

echo "🚀 Testing Dependency Notifications"
echo "========================================"

# API endpoint
API_URL="http://localhost:5000/api/v1"

# Step 1: Login
echo -e "\n🔐 Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "willy4opera@gmail.com",
    "password": "Wind@wswil24d"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.id')

echo "✅ Logged in successfully"
echo "   Token: ${TOKEN:0:20}..."

# Step 2: Get two existing tasks
echo -e "\n📋 Step 2: Getting existing tasks..."
TASKS_RESPONSE=$(curl -s -X GET $API_URL/tasks?limit=10 \
  -H "Authorization: Bearer $TOKEN")

TASK1_ID=$(echo $TASKS_RESPONSE | jq -r '.data.tasks[0].id')
TASK2_ID=$(echo $TASKS_RESPONSE | jq -r '.data.tasks[1].id')
TASK1_TITLE=$(echo $TASKS_RESPONSE | jq -r '.data.tasks[0].title')
TASK2_TITLE=$(echo $TASKS_RESPONSE | jq -r '.data.tasks[1].title')

echo "✅ Found tasks:"
echo "   Predecessor: $TASK1_TITLE (ID: $TASK1_ID)"
echo "   Successor: $TASK2_TITLE (ID: $TASK2_ID)"

# Step 3: Create dependency
echo -e "\n🔗 Step 3: Creating dependency..."
DEPENDENCY_DATA=$(cat <<JSON
{
  "predecessorTaskId": $TASK1_ID,
  "successorTaskId": $TASK2_ID,
  "dependencyType": "FS",
  "lagTime": 0,
  "notifyUsers": true
}
JSON
)

echo "Creating dependency..."
DEPENDENCY_RESPONSE=$(curl -s -X POST $API_URL/dependencies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DEPENDENCY_DATA")

DEPENDENCY_ID=$(echo $DEPENDENCY_RESPONSE | jq -r '.data.id')

if [ "$DEPENDENCY_ID" = "null" ]; then
  echo "❌ Dependency creation failed!"
  echo $DEPENDENCY_RESPONSE | jq '.'
else
  echo "✅ Dependency created successfully!"
  echo "   Dependency ID: $DEPENDENCY_ID"
  echo "   Type: FS (Finish-to-Start)"
  
  # Step 4: Check dependency notifications
  echo -e "\n📧 Step 4: Checking dependency notifications..."
  sleep 2
  
  # Get dependency with notifications
  DEPENDENCY_DETAILS=$(curl -s -X GET "$API_URL/dependencies/$DEPENDENCY_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo -e "\nDependency details:"
  echo $DEPENDENCY_DETAILS | jq '.'
fi

echo -e "\n🎉 Test completed!"
