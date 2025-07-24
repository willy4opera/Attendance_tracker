#!/bin/bash

API_BASE="http://localhost:5000/api/v1"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4
    
    echo "Testing: $method $endpoint"
    
    if [ -z "$data" ]; then
        curl -s -X $method "$API_BASE$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" | jq '.'
    else
        curl -s -X $method "$API_BASE$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data" | jq '.'
    fi
    echo ""
}

# Login as admin
echo "=== Login as Admin ==="
ADMIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"willy4opera@gmail.com","password":"Wind@wswil24d"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.data.token')
echo "Admin logged in successfully"
echo ""

# Login as regular user  
echo "=== Login as Regular User ==="
USER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"biwillzcomputergp@gmail.com","password":"Wind@wswil24d"}')

USER_TOKEN=$(echo $USER_RESPONSE | jq -r '.data.token')
echo "Regular user logged in successfully"
echo ""

# Get boards to find a task
echo "=== Get Boards ==="
BOARDS=$(curl -s -X GET "$API_BASE/boards" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
    
BOARD_ID=$(echo $BOARDS | jq -r '.data[0].id // empty')

if [ -n "$BOARD_ID" ]; then
    echo "Found board ID: $BOARD_ID"
    
    # Get task lists
    echo -e "\n=== Get Task Lists ==="
    LISTS=$(curl -s -X GET "$API_BASE/boards/$BOARD_ID/lists" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    LIST_ID=$(echo $LISTS | jq -r '.data[0].id // empty')
    
    if [ -n "$LIST_ID" ]; then
        echo "Found list ID: $LIST_ID"
        
        # Get tasks from list
        echo -e "\n=== Get Tasks from List ==="
        TASKS=$(curl -s -X GET "$API_BASE/tasks/list/$LIST_ID" \
            -H "Authorization: Bearer $ADMIN_TOKEN")
        
        echo $TASKS | jq '.data[0] // "No tasks found"'
    fi
fi

# Create a test task
echo -e "\n=== Create Test Task ==="
CREATE_TASK=$(curl -s -X POST "$API_BASE/tasks" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Test Task for Completion Review Flow",
        "description": "This task will be used to test the under-review flow",
        "priority": "medium",
        "status": "in-progress"
    }')

TASK_ID=$(echo $CREATE_TASK | jq -r '.data.id // empty')

if [ -n "$TASK_ID" ]; then
    echo "Created task with ID: $TASK_ID"
    
    # Test completion flow
    echo -e "\n=== Test Completion Flow ==="
    
    # 1. Regular user marks as complete (should go to under-review)
    echo -e "\n1. Regular user submitting for review:"
    test_endpoint "POST" "/tasks/$TASK_ID/complete" "$USER_TOKEN" ""
    
    sleep 2
    
    # 2. Admin approves completion
    echo -e "\n2. Admin approving completion:"
    test_endpoint "POST" "/tasks/$TASK_ID/approve-completion" "$ADMIN_TOKEN" ""
    
    # 3. Check history
    echo -e "\n3. Checking completion history:"
    test_endpoint "GET" "/tasks/$TASK_ID/completion-history" "$ADMIN_TOKEN" ""
    
    # Test rejection flow
    echo -e "\n=== Test Rejection Flow ==="
    
    # 4. Admin uncompletes task
    echo -e "\n4. Admin uncompleting task:"
    test_endpoint "POST" "/tasks/$TASK_ID/uncomplete" "$ADMIN_TOKEN" '{"reason": "Testing rejection flow"}'
    
    sleep 2
    
    # 5. Regular user submits again
    echo -e "\n5. Regular user submitting again:"
    test_endpoint "POST" "/tasks/$TASK_ID/complete" "$USER_TOKEN" ""
    
    sleep 2
    
    # 6. Admin rejects
    echo -e "\n6. Admin rejecting completion:"
    test_endpoint "POST" "/tasks/$TASK_ID/reject-completion" "$ADMIN_TOKEN" '{"reason": "Need more documentation"}'
    
    # 7. Final history check
    echo -e "\n7. Final completion history:"
    test_endpoint "GET" "/tasks/$TASK_ID/completion-history" "$ADMIN_TOKEN" ""
else
    echo "Failed to create task"
fi
