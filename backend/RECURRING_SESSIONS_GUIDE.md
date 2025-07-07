# Recurring Sessions Implementation Guide

## Overview

The Recurring Sessions feature allows administrators and moderators to create sessions that repeat on a regular schedule. This eliminates the need to manually create individual sessions for regular meetings, classes, or events.

## Features

1. **Multiple Recurrence Patterns**
   - Daily
   - Weekly (with specific days)
   - Monthly (on specific date)
   - Custom patterns

2. **Flexible Management**
   - Update single instance or all occurrences
   - Delete single instance or all occurrences
   - View all instances of a recurring series

3. **Automatic Generation**
   - Scheduled job to generate upcoming sessions
   - Configurable look-ahead period

## API Endpoints

### Create Recurring Sessions
```http
POST /api/v1/sessions/recurring
Authorization: Bearer {token}

{
  "title": "Weekly Team Meeting",
  "description": "Regular team sync",
  "startTime": "10:00:00",
  "endTime": "11:00:00",
  "location": "Conference Room A",
  "recurringPattern": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "frequency": "weekly",
    "interval": 1,
    "daysOfWeek": [1, 3, 5], // Mon, Wed, Fri
    "maxOccurrences": 100
  }
}
```

### Update Recurring Sessions
```http
PUT /api/v1/sessions/recurring/{parentSessionId}
Authorization: Bearer {token}

{
  "location": "New Conference Room",
  "updateScope": "all" // "this", "future", or "all"
}
```

### Delete Recurring Sessions
```http
DELETE /api/v1/sessions/recurring/{parentSessionId}?deleteScope=all
Authorization: Bearer {token}
```

### Get Recurring Instances
```http
GET /api/v1/sessions/recurring/{parentSessionId}/instances?startDate=2024-01-01&endDate=2024-03-31
Authorization: Bearer {token}
```

### Generate Upcoming Sessions (Admin Only)
```http
POST /api/v1/sessions/recurring/generate-upcoming
Authorization: Bearer {token}

{
  "daysAhead": 30
}
```

## Recurrence Pattern Schema

```javascript
{
  "startDate": "YYYY-MM-DD",      // Required: Start date for recurrence
  "endDate": "YYYY-MM-DD",        // Required: End date for recurrence
  "frequency": "daily|weekly|monthly|custom", // Required
  "interval": 1,                  // Optional: Interval between occurrences
  "daysOfWeek": [0-6],           // For weekly: 0=Sunday, 6=Saturday
  "dayOfMonth": 1-31,            // For monthly: Day of month
  "maxOccurrences": 100          // Optional: Maximum number of occurrences
}
```

## Examples

### Daily Standup (Weekdays Only)
```javascript
{
  "title": "Daily Standup",
  "startTime": "09:00:00",
  "endTime": "09:15:00",
  "recurringPattern": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "frequency": "weekly",
    "interval": 1,
    "daysOfWeek": [1, 2, 3, 4, 5] // Monday to Friday
  }
}
```

### Monthly Board Meeting
```javascript
{
  "title": "Board Meeting",
  "startTime": "14:00:00",
  "endTime": "16:00:00",
  "recurringPattern": {
    "startDate": "2024-01-15",
    "endDate": "2024-12-31",
    "frequency": "monthly",
    "interval": 1,
    "dayOfMonth": 15
  }
}
```

### Bi-weekly Training Sessions
```javascript
{
  "title": "Training Session",
  "startTime": "13:00:00",
  "endTime": "15:00:00",
  "recurringPattern": {
    "startDate": "2024-01-01",
    "endDate": "2024-06-30",
    "frequency": "weekly",
    "interval": 2, // Every 2 weeks
    "daysOfWeek": [2] // Tuesday
  }
}
```

## Database Schema

### Parent Session
- `isRecurring`: true
- `recurringPattern`: JSON object with recurrence configuration
- Contains the template for all child sessions

### Child Sessions
- `isRecurring`: false
- `parentSessionId`: References the parent session
- Individual instances that can be modified independently

## Scheduled Job

The system includes a scheduled job that runs daily at 2 AM to generate upcoming sessions for the next 30 days. This ensures that recurring sessions are always available for booking and attendance tracking.

### Manual Trigger
Administrators can manually trigger the generation of upcoming sessions through the API endpoint.

## Best Practices

1. **Set Reasonable End Dates**: Don't create recurring sessions that extend too far into the future
2. **Use maxOccurrences**: Limit the number of sessions to prevent database bloat
3. **Review Regularly**: Periodically review and update recurring sessions
4. **Handle Exceptions**: Use updateScope="this" to modify individual instances for holidays or special cases

## Frontend Implementation

```javascript
// Create recurring session
const createRecurringSession = async (sessionData) => {
  const response = await fetch('/api/v1/sessions/recurring', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(sessionData)
  });
  
  return response.json();
};

// Update all future sessions
const updateFutureSessions = async (parentId, updates) => {
  const response = await fetch(`/api/v1/sessions/recurring/${parentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...updates,
      updateScope: 'future'
    })
  });
  
  return response.json();
};
```

## Troubleshooting

### Sessions Not Generating
1. Check that the parent session has `isRecurring: true`
2. Verify the recurring pattern is valid
3. Check if the end date has passed
4. Review server logs for scheduled job errors

### Update Not Affecting All Sessions
1. Verify the updateScope parameter
2. Check if child sessions have been manually modified
3. Ensure proper permissions

### Performance Considerations
1. Limit the number of sessions generated at once
2. Use pagination when fetching instances
3. Consider archiving old sessions
