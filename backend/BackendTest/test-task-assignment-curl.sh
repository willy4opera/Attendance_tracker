#!/bin/bash

echo "🚀 Testing Task Assignment Notifications"
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

# Extract token and user info - fixed path
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.id')
USER_NAME=$(echo $LOGIN_RESPONSE | jq -r '.data.user.firstName + " " + .data.user.lastName')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed!"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Logged in as: $USER_NAME"
echo "   Token: ${TOKEN:0:20}..."

# Step 2: Get user ID for assignee
echo -e "\n👥 Step 2: Finding assignee user..."
USERS_RESPONSE=$(curl -s -X GET $API_URL/users \
  -H "Authorization: Bearer $TOKEN")

ASSIGNEE_ID=$(echo $USERS_RESPONSE | jq -r '.data.users[] | select(.email == "biwillzcomputergp@gmail.com") | .id')
ASSIGNEE_NAME=$(echo $USERS_RESPONSE | jq -r '.data.users[] | select(.email == "biwillzcomputergp@gmail.com") | .firstName + " " + .lastName')

if [ -z "$ASSIGNEE_ID" ]; then
  echo "❌ Assignee user not found!"
  echo "Users response:"
  echo $USERS_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Found assignee: $ASSIGNEE_NAME (ID: $ASSIGNEE_ID)"

# Step 3: Get project and board info
echo -e "\n📋 Step 3: Getting project and board info..."
PROJECTS_RESPONSE=$(curl -s -X GET $API_URL/projects \
  -H "Authorization: Bearer $TOKEN")

PROJECT_ID=$(echo $PROJECTS_RESPONSE | jq -r '.data.projects[0].id')
PROJECT_NAME=$(echo $PROJECTS_RESPONSE | jq -r '.data.projects[0].name')

if [ "$PROJECT_ID" = "null" ]; then
  echo "❌ No projects found!"
  echo $PROJECTS_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Using project: $PROJECT_NAME (ID: $PROJECT_ID)"

# Get boards
BOARDS_RESPONSE=$(curl -s -X GET "$API_URL/boards?projectId=$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN")

BOARD_ID=$(echo $BOARDS_RESPONSE | jq -r '.data.boards[0].id')
BOARD_NAME=$(echo $BOARDS_RESPONSE | jq -r '.data.boards[0].name')

if [ "$BOARD_ID" = "null" ]; then
  echo "❌ No boards found!"
  echo $BOARDS_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Using board: $BOARD_NAME (ID: $BOARD_ID)"

# Get board details with lists
BOARD_DETAILS=$(curl -s -X GET "$API_URL/boards/$BOARD_ID" \
  -H "Authorization: Bearer $TOKEN")

LIST_ID=$(echo $BOARD_DETAILS | jq -r '.data.lists[0].id')
LIST_NAME=$(echo $BOARD_DETAILS | jq -r '.data.lists[0].name')

if [ "$LIST_ID" = "null" ]; then
  echo "❌ No lists found!"
  echo $BOARD_DETAILS | jq '.'
  exit 1
fi

echo "✅ Using list: $LIST_NAME (ID: $LIST_ID)"

# Step 4: Create task with assignment
echo -e "\n📝 Step 4: Creating task with assignment..."

# Calculate due date (7 days from now)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  DUE_DATE=$(date -v+7d -u +"%Y-%m-%dT%H:%M:%S.000Z")
else
  # Linux
  DUE_DATE=$(date -d '+7 days' -u +"%Y-%m-%dT%H:%M:%S.000Z")
fi

TASK_DATA=$(cat <<JSON
{
  "title": "Test Task Assignment - $(date)",
  "description": "Testing the assignment notification system",
  "taskListId": $LIST_ID,
  "priority": "high",
  "assignedTo": [$ASSIGNEE_ID],
  "assignedDepartments": [],
  "labels": ["test", "notification"],
  "dueDate": "$DUE_DATE"
}
JSON
)

echo "📤 Creating task..."
echo "Task data: $TASK_DATA"

CREATE_RESPONSE=$(curl -s -X POST $API_URL/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$TASK_DATA")

TASK_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')
TASK_TITLE=$(echo $CREATE_RESPONSE | jq -r '.data.title')

if [ "$TASK_ID" = "null" ]; then
  echo "❌ Task creation failed!"
  echo $CREATE_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Task created successfully!"
echo "   Task ID: $TASK_ID"
echo "   Title: $TASK_TITLE"
echo "   Assigned to user ID: $ASSIGNEE_ID"

# Step 5: Check notifications
echo -e "\n📧 Step 5: Checking notifications..."
sleep 3

NOTIFICATIONS_RESPONSE=$(curl -s -X GET "$API_URL/tasks/$TASK_ID/notifications" \
  -H "Authorization: Bearer $TOKEN")

NOTIFICATION_COUNT=$(echo $NOTIFICATIONS_RESPONSE | jq -r '.data.notifications | length')

if [ "$NOTIFICATION_COUNT" = "null" ]; then
  echo "⚠️  Could not fetch notifications (endpoint might not be available)"
  echo $NOTIFICATIONS_RESPONSE | jq '.'
else
  echo "✅ Found $NOTIFICATION_COUNT notification(s)"
  echo $NOTIFICATIONS_RESPONSE | jq '.data.notifications[] | {type: .notificationType, status: .status, recipients: (.recipients | length), channels: .channels}'
fi

echo -e "\n🎉 Test completed!"
echo "📌 Next steps:"
echo "   1. Check biwillzcomputergp@gmail.com inbox for email notification"
echo "   2. Log in as biwillzcomputergp@gmail.com to see in-app notification"
echo "   3. Task created with ID: $TASK_ID"
