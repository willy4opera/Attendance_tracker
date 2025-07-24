#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:5000/api/v1"
SESSION_ID="37525856-6ff4-44bb-ab6f-1374649970bc"
USER_ID=7

# Read token
if [ ! -f /tmp/auth_token ]; then
    echo -e "${RED}Error: Token file /tmp/auth_token not found${NC}"
    exit 1
fi

TOKEN=$(cat /tmp/auth_token)
echo -e "${GREEN}✓ Token loaded${NC}"

# Function to get current attendance
get_attendance() {
    echo -e "\n${BLUE}Fetching current attendance for user ${USER_ID}...${NC}"
    
    RESPONSE=$(curl -X GET "${API_BASE_URL}/attendance/sessions/${SESSION_ID}/attendance" \
        -H "Authorization: Bearer ${TOKEN}" \
        -s)
    
    # Extract user attendance
    USER_ATTENDANCE=$(echo "$RESPONSE" | jq ".data.attendances[] | select(.userId == ${USER_ID})")
    
    if [ -n "$USER_ATTENDANCE" ]; then
        echo -e "${GREEN}✓ Current attendance:${NC}"
        echo "$USER_ATTENDANCE" | jq '{id: .id, userId: .userId, status: .status, notes: .notes, previousStatus: .metadata.previousStatus, updatedAt: .updatedAt}'
        
        # Extract attendance ID for update
        ATTENDANCE_ID=$(echo "$USER_ATTENDANCE" | jq -r '.id')
        echo -e "${YELLOW}Attendance ID: ${ATTENDANCE_ID}${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ No attendance record found for user ${USER_ID}${NC}"
        return 1
    fi
}

# Function to update attendance
update_attendance() {
    local attendance_id=$1
    local status=$2
    local notes=$3
    
    echo -e "\n${BLUE}Updating attendance ${attendance_id}...${NC}"
    echo -e "Status: ${status}"
    echo -e "Notes: ${notes}"
    
    RESPONSE=$(curl -X PUT "${API_BASE_URL}/attendance/${attendance_id}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"status\": \"${status}\", \"notes\": \"${notes}\"}" \
        -s)
    
    if echo "$RESPONSE" | jq -e '.status == "success"' > /dev/null; then
        echo -e "${GREEN}✓ Attendance updated successfully${NC}"
        echo "$RESPONSE" | jq '.data.attendance | {id: .id, status: .status, notes: .notes, updatedAt: .updatedAt}'
    else
        echo -e "${RED}✗ Failed to update attendance${NC}"
        echo "$RESPONSE" | jq '.'
    fi
}

# Function to mark new attendance
mark_attendance() {
    local status=$1
    local notes=$2
    
    echo -e "\n${BLUE}Marking new attendance for user ${USER_ID}...${NC}"
    echo -e "Status: ${status}"
    echo -e "Notes: ${notes}"
    
    RESPONSE=$(curl -X POST "${API_BASE_URL}/attendance/mark-manual" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"userId\": ${USER_ID}, \"sessionId\": \"${SESSION_ID}\", \"status\": \"${status}\", \"notes\": \"${notes}\"}" \
        -s)
    
    if echo "$RESPONSE" | jq -e '.status == "success"' > /dev/null; then
        echo -e "${GREEN}✓ Attendance marked successfully${NC}"
        echo "$RESPONSE" | jq '.data | {id: .id, status: .status, notes: .notes, checkInTime: .checkInTime}'
    else
        echo -e "${RED}✗ Failed to mark attendance${NC}"
        echo "$RESPONSE" | jq '.'
    fi
}

# Main execution
echo -e "${GREEN}=== Attendance Update Test Script ===${NC}"
echo -e "Session ID: ${SESSION_ID}"
echo -e "User ID: ${USER_ID}"

# Get current attendance
if get_attendance; then
    # Update existing attendance
    echo -e "\n${YELLOW}Updating existing attendance...${NC}"
    
    # Generate timestamp for unique notes
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    
    # Test different status updates
    echo -e "\n${BLUE}Test 1: Update to 'present'${NC}"
    update_attendance "$ATTENDANCE_ID" "present" "Updated via test script at ${TIMESTAMP}"
    sleep 2
    
    echo -e "\n${BLUE}Test 2: Update to 'late'${NC}"
    update_attendance "$ATTENDANCE_ID" "late" "Late arrival - test at ${TIMESTAMP}"
    sleep 2
    
    echo -e "\n${BLUE}Test 3: Update to 'excused'${NC}"
    update_attendance "$ATTENDANCE_ID" "excused" "Excused absence - test at ${TIMESTAMP}"
    
else
    # Mark new attendance
    echo -e "\n${YELLOW}Marking new attendance...${NC}"
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    mark_attendance "present" "Marked via test script at ${TIMESTAMP}"
fi

# Final check
echo -e "\n${BLUE}Final attendance status:${NC}"
get_attendance

echo -e "\n${GREEN}✓ Test completed${NC}"
echo -e "${YELLOW}Note: Check the socket monitor or other connected clients to verify real-time updates${NC}"
