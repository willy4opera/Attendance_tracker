#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:5000/api/v1"

# Test credentials
REGULAR_USER_EMAIL="biwillzcomputergp@gmail.com"
REGULAR_USER_PASSWORD="Wind@wswil24d"
ADMIN_EMAIL="willy4opera@gmail.com"
ADMIN_PASSWORD="Wind@wswil24d"

echo -e "${YELLOW}=== Task Completion Flow Test ===${NC}\n"

# Step 1: Login as regular user
echo -e "${GREEN}1. Logging in as regular user...${NC}"
REGULAR_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$REGULAR_USER_EMAIL\",\"password\":\"$REGULAR_USER_PASSWORD\"}")

REGULAR_TOKEN=$(echo $REGULAR_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$REGULAR_TOKEN" ]; then
  echo -e "${RED}Failed to login as regular user${NC}"
  echo $REGULAR_LOGIN
  exit 1
fi
echo -e "✓ Regular user logged in\n"

# Step 2: Login as admin
echo -e "${GREEN}2. Logging in as admin...${NC}"
ADMIN_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}Failed to login as admin${NC}"
  echo $ADMIN_LOGIN
  exit 1
fi
echo -e "✓ Admin logged in\n"

# Step 3: Get a task to test with
echo -e "${GREEN}3. Getting a task to test with...${NC}"
TASKS=$(curl -s -X GET "$API_BASE/tasks" \
  -H "Authorization: Bearer $REGULAR_TOKEN")

TASK_ID=$(echo $TASKS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TASK_ID" ]; then
  echo -e "${RED}No tasks found${NC}"
  exit 1
fi
echo -e "✓ Using task ID: $TASK_ID\n"

# Step 4: Regular user submits task for review
echo -e "${GREEN}4. Regular user submitting task for review...${NC}"
SUBMIT_RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/complete" \
  -H "Authorization: Bearer $REGULAR_TOKEN" \
  -H "Content-Type: application/json")

echo $SUBMIT_RESPONSE | jq '.'
echo -e "\n"

# Wait a bit
sleep 2

# Step 5: Admin approves the task
echo -e "${GREEN}5. Admin approving task completion...${NC}"
APPROVE_RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/approve-completion" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo $APPROVE_RESPONSE | jq '.'
echo -e "\n"

# Step 6: Check task completion history
echo -e "${GREEN}6. Checking task completion history...${NC}"
HISTORY_RESPONSE=$(curl -s -X GET "$API_BASE/tasks/$TASK_ID/completion-history" \
  -H "Authorization: Bearer $REGULAR_TOKEN")

echo $HISTORY_RESPONSE | jq '.'
echo -e "\n"

# Test rejection flow
echo -e "${YELLOW}=== Testing Rejection Flow ===${NC}\n"

# Step 7: Admin marks task as uncompleted to reset
echo -e "${GREEN}7. Admin marking task as uncompleted...${NC}"
UNCOMPLETE_RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/uncomplete" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Resetting for rejection flow test"}')

echo $UNCOMPLETE_RESPONSE | jq '.'
echo -e "\n"

sleep 2

# Step 8: Regular user submits again
echo -e "${GREEN}8. Regular user submitting task for review again...${NC}"
SUBMIT_AGAIN=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/complete" \
  -H "Authorization: Bearer $REGULAR_TOKEN" \
  -H "Content-Type: application/json")

echo $SUBMIT_AGAIN | jq '.'
echo -e "\n"

sleep 2

# Step 9: Admin rejects the task
echo -e "${GREEN}9. Admin rejecting task completion...${NC}"
REJECT_RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/reject-completion" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Missing unit tests and documentation"}')

echo $REJECT_RESPONSE | jq '.'
echo -e "\n"

# Step 10: Final history check
echo -e "${GREEN}10. Final task completion history...${NC}"
FINAL_HISTORY=$(curl -s -X GET "$API_BASE/tasks/$TASK_ID/completion-history" \
  -H "Authorization: Bearer $REGULAR_TOKEN")

echo $FINAL_HISTORY | jq '.data.logs[] | {action: .action, userId: .userId, reason: .reason, createdAt: .createdAt}'

echo -e "\n${GREEN}✓ Test completed!${NC}"
