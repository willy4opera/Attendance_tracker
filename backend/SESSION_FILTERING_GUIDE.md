# Session Filtering and Search Guide

## Overview
Enhanced session management with advanced filtering, search, and statistics capabilities.

## New Endpoints

### 1. Session Statistics
**Endpoint:** `GET /api/v1/sessions/statistics/summary`

**Query Parameters:**
- `startDate` (optional): Filter statistics from this date
- `endDate` (optional): Filter statistics until this date

**Example Response:**
```json
{
  "status": "success",
  "data": {
    "statistics": {
      "total": 11,
      "upcoming": 5,
      "byStatus": {
        "scheduled": 5,
        "active": 1,
        "completed": 5
      }
    }
  }
}
```

### 2. Session Search/Autocomplete
**Endpoint:** `GET /api/v1/sessions/search/autocomplete`

**Query Parameters:**
- `q` (required): Search query (minimum 2 characters)
- `limit` (optional): Maximum results to return (default: 10)

**Example:**
```bash
GET /api/v1/sessions/search/autocomplete?q=Team&limit=5
```

### 3. Enhanced Session Listing
**Endpoint:** `GET /api/v1/sessions`

**New Query Parameters:**
- `search`: Search across title, description, location, and category
- `startDate`: Filter sessions starting from this date
- `endDate`: Filter sessions until this date
- `status`: Filter by status (can be array)
- `facilitatorId`: Filter by facilitator
- `isVirtual`: Filter virtual/in-person sessions (true/false)
- `meetingType`: Filter by meeting platform (zoom, google_meet, teams, etc.)
- `category`: Filter by category
- `tags`: Filter by tags (comma-separated)
- `sortBy`: Sort field (default: sessionDate)
- `sortOrder`: Sort direction (ASC/DESC, default: DESC)
- `upcoming`: Set to 'true' to get only future sessions

**Examples:**

1. Get upcoming virtual sessions:
```bash
GET /api/v1/sessions?upcoming=true&isVirtual=true
```

2. Search sessions with date range:
```bash
GET /api/v1/sessions?startDate=2025-07-01&endDate=2025-07-31&status=scheduled
```

3. Advanced search with sorting:
```bash
GET /api/v1/sessions?search=Team&sortBy=title&sortOrder=ASC&limit=20
```

## Features Added

### ✅ Session Filtering and Search
- Multi-field search across title, description, location, and category
- Date range filtering
- Status filtering (supports multiple statuses)
- Virtual/In-person filtering
- Meeting type filtering
- Category and tag filtering
- Facilitator filtering
- Upcoming sessions filter

### ✅ Session Statistics
- Total session count
- Upcoming session count
- Breakdown by status
- Date range support for statistics

### ✅ Autocomplete Search
- Fast search suggestions
- Excludes cancelled sessions
- Returns minimal data for performance

### ✅ Enhanced Response Data
- Sessions now include attendance count
- Facilitator details included
- Proper pagination metadata

## Usage Examples

### Frontend Implementation

```javascript
// Get session statistics
const getSessionStats = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(`/api/v1/sessions/statistics/summary?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Search sessions with autocomplete
const searchSessions = async (query) => {
  const response = await fetch(`/api/v1/sessions/search/autocomplete?q=${query}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Advanced filtering
const getFilteredSessions = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/v1/sessions?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## Next Steps
- Add recurring session support
- Implement QR code generation
- Add geolocation filtering
- Create session templates
- Add bulk operations
