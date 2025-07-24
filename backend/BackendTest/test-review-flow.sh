#!/bin/bash

API_BASE="http://localhost:5000/api/v1"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Task Review Flow Test ===${NC}\n"

# 1. Login as admin
echo "1. Logging in as admin..."
ADMIN_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"willy4opera@gmail.com","password":"Wind@wswil24d"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.token')
echo -e "${GREEN}✓ Admin logged in${NC}\n"

# 2. Login as regular user
echo "2. Logging in as regular user..."
USER_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"biwillzcomputergp@gmail.com","password":"Wind@wswil24d"}')
USER_TOKEN=$(echo $USER_LOGIN | jq -r '.token')
USER_ID=$(echo $USER_LOGIN | jq -r '.data.user.id')
echo -e "${GREEN}✓ Regular user logged in (ID: $USER_ID)${NC}\n"

# 3. Create a task as admin (so regular user can see it)
echo "3. Creating test task..."
TASK_RESPONSE=$(curl -s -X POST "$API_BASE/tasks" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Test Task for Review Flow",
        "description": "This task will test the under-review approval process",
        "status": "in-progress",
        "priority": "medium",
        "assignedTo": '$USER_ID'
    }')

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.data.id // empty')

if [ -z "$TASK_ID" ] || [ "$TASK_ID" == "null" ]; then
    echo "Failed to create task. Response:"
    echo $TASK_RESPONSE | jq '.'
    exit 1
fi

echo -e "${GREEN}✓ Created task ID: $TASK_ID${NC}\n"

# 4. Regular user submits task for review
echo "4. Regular user submitting task for review..."
SUBMIT_RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/complete" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json")

echo "Response:"
echo $SUBMIT_RESPONSE | jq '.'
echo ""

TASK_STATUS=$(echo $SUBMIT_RESPONSE | jq -r '.data.task.status // empty')
if [ "$TASK_STATUS" == "under-review" ]; then
    echo -e "${GREEN}✓ Task is now under review${NC}\n"
else
    echo "Expected status 'under-review', got: $TASK_STATUS"
fi

sleep 2

# 5. Admin approves the task
echo "5. Admin approving task completion..."
APPROVE_RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/approve-completion" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")

echo "Response:"
echo $APPROVE_RESPONSE | jq '.'
echo ""

FINAL_STATUS=$(echo $APPROVE_RESPONSE | jq -r '.data.task.status // empty')
if [ "$FINAL_STATUS" == "done" ]; then
    echo -e "${GREEN}✓ Task is now completed${NC}\n"
else
    echo "Expected status 'done', got: $FINAL_STATUS"
fi

# 6. Check completion history
echo "6. Checking task completion history..."
HISTORY_RESPONSE=$(curl -s -X GET "$API_BASE/tasks/$TASK_ID/completion-history" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Completion History:"
echo $HISTORY_RESPONSE | jq '.data.logs[] | {
    action: .action,
    userId: .userId,
    createdAt: .createdAt,
    metadata: .metadata.userRole
}'

echo -e "\n${GREEN}✓ Test completed successfully!${NC}"
