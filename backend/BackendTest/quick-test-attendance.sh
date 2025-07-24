#!/bin/bash

# Quick test script for attendance updates

TOKEN=$(cat /tmp/auth_token)
SESSION_ID="37525856-6ff4-44bb-ab6f-1374649970bc"
USER_ID=7
API_URL="http://localhost:5000/api/v1"

echo "🔍 Getting current attendance for user $USER_ID..."

# Get attendance and extract ID
ATTENDANCE_DATA=$(curl -s -X GET "$API_URL/attendance/sessions/$SESSION_ID/attendance" \
  -H "Authorization: Bearer $TOKEN" | \
  jq ".data.attendances[] | select(.userId == $USER_ID)")

if [ -n "$ATTENDANCE_DATA" ]; then
    ATTENDANCE_ID=$(echo "$ATTENDANCE_DATA" | jq -r '.id')
    CURRENT_STATUS=$(echo "$ATTENDANCE_DATA" | jq -r '.status')
    
    echo "✓ Found attendance ID: $ATTENDANCE_ID (Current status: $CURRENT_STATUS)"
    
    # Determine new status
    if [ "$CURRENT_STATUS" == "present" ]; then
        NEW_STATUS="late"
    elif [ "$CURRENT_STATUS" == "late" ]; then
        NEW_STATUS="absent"
    else
        NEW_STATUS="present"
    fi
    
    echo "📝 Updating status from '$CURRENT_STATUS' to '$NEW_STATUS'..."
    
    # Update attendance
    UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/attendance/$ATTENDANCE_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"status\": \"$NEW_STATUS\", \"notes\": \"Updated via quick test at $(date)\"}")
    
    if echo "$UPDATE_RESPONSE" | jq -e '.status == "success"' > /dev/null; then
        echo "✅ Successfully updated attendance!"
        echo "$UPDATE_RESPONSE" | jq '.data.attendance | {id: .id, status: .status, notes: .notes}'
    else
        echo "❌ Failed to update attendance"
        echo "$UPDATE_RESPONSE" | jq '.'
    fi
else
    echo "⚠️  No attendance found. Creating new attendance..."
    
    # Mark new attendance
    MARK_RESPONSE=$(curl -s -X POST "$API_URL/attendance/mark-manual" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"userId\": $USER_ID, \"sessionId\": \"$SESSION_ID\", \"status\": \"present\", \"notes\": \"Created via quick test at $(date)\"}")
    
    if echo "$MARK_RESPONSE" | jq -e '.status == "success"' > /dev/null; then
        echo "✅ Successfully marked attendance!"
        echo "$MARK_RESPONSE" | jq '.data | {id: .id, status: .status, notes: .notes}'
    else
        echo "❌ Failed to mark attendance"
        echo "$MARK_RESPONSE" | jq '.'
    fi
fi

echo ""
echo "💡 To monitor socket events, run in another terminal:"
echo "   node /var/www/html/Attendance_tracker/backend/monitor-socket-events.js"
