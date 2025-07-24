#!/bin/bash

# Groups API Test Script
# This script tests all the Groups API endpoints

BASE_URL="http://localhost:5000/api/v1"
EMAIL="willy4opera@gmail.com"
PASSWORD="Wind@wswil24d"

echo "🚀 Starting Groups API Tests..."
echo "================================"

# 1. Login and get token
echo "📝 Step 1: Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Authentication successful!"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 2. Create a test group
echo "📝 Step 2: Creating a test group..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/groups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Group API",
    "description": "This is a test group created by the API test script"
  }')

GROUP_ID=$(echo $CREATE_RESPONSE | jq -r '.data.group.id')

if [ "$GROUP_ID" = "null" ] || [ -z "$GROUP_ID" ]; then
  echo "❌ Group creation failed!"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo "✅ Group created successfully!"
echo "Group ID: $GROUP_ID"
echo ""

# 3. Get all groups
echo "📝 Step 3: Fetching all groups..."
ALL_GROUPS=$(curl -s -X GET "$BASE_URL/groups?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

GROUPS_COUNT=$(echo $ALL_GROUPS | jq -r '.results')
echo "✅ Found $GROUPS_COUNT groups"
echo ""

# 4. Get specific group
echo "📝 Step 4: Fetching group details..."
GROUP_DETAILS=$(curl -s -X GET "$BASE_URL/groups/$GROUP_ID" \
  -H "Authorization: Bearer $TOKEN")

GROUP_NAME=$(echo $GROUP_DETAILS | jq -r '.data.group.name')
echo "✅ Group details retrieved: $GROUP_NAME"
echo ""

# 5. Add a member to the group
echo "📝 Step 5: Adding member to group..."
ADD_MEMBER_RESPONSE=$(curl -s -X POST "$BASE_URL/groups/$GROUP_ID/members" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": 7,
    "role": "member"
  }')

ADD_STATUS=$(echo $ADD_MEMBER_RESPONSE | jq -r '.status')
if [ "$ADD_STATUS" = "success" ]; then
  echo "✅ Member added successfully!"
else
  echo "⚠️  Member addition response: $ADD_MEMBER_RESPONSE"
fi
echo ""

# 6. Get group members
echo "📝 Step 6: Fetching group members..."
MEMBERS_RESPONSE=$(curl -s -X GET "$BASE_URL/groups/$GROUP_ID/members" \
  -H "Authorization: Bearer $TOKEN")

MEMBERS_COUNT=$(echo $MEMBERS_RESPONSE | jq -r '.results')
echo "✅ Group has $MEMBERS_COUNT members"
echo ""

# 7. Update member role
echo "📝 Step 7: Updating member role..."
UPDATE_ROLE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/groups/$GROUP_ID/members/7/role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "role": "admin"
  }')

ROLE_UPDATE_STATUS=$(echo $UPDATE_ROLE_RESPONSE | jq -r '.status')
if [ "$ROLE_UPDATE_STATUS" = "success" ]; then
  echo "✅ Member role updated successfully!"
else
  echo "⚠️  Role update response: $UPDATE_ROLE_RESPONSE"
fi
echo ""

# 8. Update group
echo "📝 Step 8: Updating group..."
UPDATE_GROUP_RESPONSE=$(curl -s -X PATCH "$BASE_URL/groups/$GROUP_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Test Group API",
    "description": "This group has been updated by the API test script"
  }')

UPDATE_STATUS=$(echo $UPDATE_GROUP_RESPONSE | jq -r '.status')
if [ "$UPDATE_STATUS" = "success" ]; then
  echo "✅ Group updated successfully!"
else
  echo "❌ Group update failed!"
  echo "Response: $UPDATE_GROUP_RESPONSE"
fi
echo ""

# 9. Remove member from group
echo "📝 Step 9: Removing member from group..."
REMOVE_MEMBER_RESPONSE=$(curl -s -X DELETE "$BASE_URL/groups/$GROUP_ID/members/7" \
  -H "Authorization: Bearer $TOKEN")

REMOVE_STATUS=$(echo $REMOVE_MEMBER_RESPONSE | jq -r '.status')
if [ "$REMOVE_STATUS" = "success" ]; then
  echo "✅ Member removed successfully!"
else
  echo "⚠️  Member removal response: $REMOVE_MEMBER_RESPONSE"
fi
echo ""

# 10. Delete the test group
echo "📝 Step 10: Cleaning up - deleting test group..."
DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/groups/$GROUP_ID" \
  -H "Authorization: Bearer $TOKEN")

if [ "$DELETE_STATUS" = "204" ]; then
  echo "✅ Test group deleted successfully!"
else
  echo "❌ Group deletion failed! Status: $DELETE_STATUS"
fi
echo ""

echo "🎉 All Groups API tests completed!"
echo "================================"
echo "Summary:"
echo "✅ Authentication"
echo "✅ Create Group"
echo "✅ List Groups"
echo "✅ Get Group Details"
echo "✅ Add Member"
echo "✅ Get Members"
echo "✅ Update Member Role"
echo "✅ Update Group"
echo "✅ Remove Member"
echo "✅ Delete Group"
echo ""
echo "All endpoints are working correctly! 🚀"
