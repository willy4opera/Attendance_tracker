#!/bin/bash

API_BASE="http://localhost:5000/api/v1"
TASK_ID=181  # Using the task ID from the documentation

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== Testing Task Completion Review Flow with Task ID: $TASK_ID ===${NC}\n"

# 1. Login as admin
echo "1. Logging in as admin..."
ADMIN_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"willy4opera@gmail.com","password":"Wind@wswil24d"}' | jq -r '.token')
echo -e "${GREEN}✓ Admin logged in${NC}\n"

# 2. Login as regular user
echo "2. Logging in as regular user..."
USER_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"biwillzcomputergp@gmail.com","password":"Wind@wswil24d"}' | jq -r '.token')
echo -e "${GREEN}✓ Regular user logged in${NC}\n"

# 3. Check task current status
echo "3. Checking current task status..."
TASK_CHECK=$(curl -s -X GET "$API_BASE/tasks/$TASK_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$TASK_CHECK" | jq -e '.data' > /dev/null 2>&1; then
    CURRENT_STATUS=$(echo $TASK_CHECK | jq -r '.data.status')
    echo "Current task status: $CURRENT_STATUS"
    
    # If task is already done or under-review, reset it
    if [ "$CURRENT_STATUS" == "done" ] || [ "$CURRENT_STATUS" == "under-review" ]; then
        echo -e "\n${YELLOW}Resetting task to in-progress...${NC}"
        RESET_RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/uncomplete" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"reason": "Resetting for test"}')
        echo $RESET_RESPONSE | jq '.message'
        sleep 1
    fi
else
    echo -e "${RED}Task $TASK_ID not found${NC}"
    echo $TASK_CHECK | jq '.'
    exit 1
fi

echo -e "\n4. Regular user submitting task for review..."
SUBMIT_RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/complete" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json")

echo "Response:"
echo $SUBMIT_RESPONSE | jq '.'

STATUS=$(echo $SUBMIT_RESPONSE | jq -r '.data.task.status // empty')
if [ "$STATUS" == "under-review" ]; then
    echo -e "\n${GREEN}✓ Task successfully submitted for review!${NC}\n"
else
    echo -e "\n${RED}Unexpected status: $STATUS${NC}\n"
fi

sleep 2

# 5. Admin approves the task
echo "5. Admin approving task completion..."
APPROVE_RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/approve-completion" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")

echo "Response:"
echo $APPROVE_RESPONSE | jq '.'

FINAL_STATUS=$(echo $APPROVE_RESPONSE | jq -r '.data.task.status // empty')
if [ "$FINAL_STATUS" == "done" ]; then
    echo -e "\n${GREEN}✓ Task approved and marked as done!${NC}\n"
else
    echo -e "\n${RED}Unexpected status: $FINAL_STATUS${NC}\n"
fi

# 6. Test rejection flow
echo -e "${YELLOW}=== Testing Rejection Flow ===${NC}\n"

# Reset task
echo "6. Resetting task for rejection test..."
RESET2=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/uncomplete" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"reason": "Testing rejection flow"}')
echo $RESET2 | jq '.message'

sleep 1

# Submit again
echo -e "\n7. Regular user submitting again..."
SUBMIT2=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/complete" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json")
echo $SUBMIT2 | jq '.message'

sleep 1

# Admin rejects
echo -e "\n8. Admin rejecting the submission..."
REJECT_RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/reject-completion" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"reason": "Missing unit tests and documentation"}')

echo "Response:"
echo $REJECT_RESPONSE | jq '.'

REJECTED_STATUS=$(echo $REJECT_RESPONSE | jq -r '.data.task.status // empty')
if [ "$REJECTED_STATUS" == "in-progress" ]; then
    echo -e "\n${GREEN}✓ Task rejected and returned to in-progress!${NC}\n"
else
    echo -e "\n${RED}Unexpected status: $REJECTED_STATUS${NC}\n"
fi

# 9. Check completion history
echo "9. Checking task completion history..."
HISTORY=$(curl -s -X GET "$API_BASE/tasks/$TASK_ID/completion-history" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo -e "\nCompletion History:"
echo $HISTORY | jq '.data.logs[] | {
    action: .action,
    userId: .userId,
    reason: .reason,
    createdAt: .createdAt
}'

echo -e "\n${GREEN}✓ All tests completed!${NC}"
