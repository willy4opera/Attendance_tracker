# Attendance Tracker API Documentation

Welcome to the Attendance Tracker API documentation. This comprehensive guide will help you understand and integrate with our REST API.

## API Overview

The Attendance Tracker API is a RESTful service that provides endpoints for managing:
- User authentication and authorization
- Groups and group memberships
- Sessions and session management
- Attendance tracking
- User management
- And more...

## Base URL

```
http://localhost:5000/api/v1
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints Documentation

### 🔐 Authentication
- [Authentication API](./api/auth.md) *(Coming Soon)*

### 👥 Groups Management
- [**Groups API**](./api/groups.md) - Complete CRUD operations for groups and memberships

### 📅 Sessions Management
- [Sessions API](./api/sessions.md) *(Coming Soon)*

### 📋 Attendance Tracking
- [Attendance API](./api/attendance.md) *(Coming Soon)*

### 👤 User Management
- [Users API](./api/users.md) *(Coming Soon)*

## Quick Start

### 1. Authentication
```bash
# Login to get your JWT token
curl -X POST "http://localhost:5000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

### 2. Use the Token
```bash
# Use the token in subsequent requests
curl -X GET "http://localhost:5000/api/v1/groups" \
  -H "Authorization: Bearer your_jwt_token"
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "status": "success",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description here"
}
```

### Paginated Response
```json
{
  "status": "success",
  "results": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalResults": 50
  },
  "data": {
    // Paginated data here
  }
}
```

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content returned
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

- **Global Rate Limit**: 100 requests per 15 minutes per user
- **Burst Limit**: 20 requests per minute per user
- Rate limit headers are included in responses:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1642780800
  ```

## Pagination

Many endpoints support pagination using query parameters:

- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default varies by endpoint, max: 100)

Example:
```bash
curl "http://localhost:5000/api/v1/groups?page=2&limit=20"
```

## Filtering and Searching

Many endpoints support filtering and searching:

- `search` (string): Search term
- `isActive` (boolean): Filter by active status
- Custom filters vary by endpoint

Example:
```bash
curl "http://localhost:5000/api/v1/groups?search=dev&isActive=true"
```

## Error Handling Best Practices

1. **Always check the response status**
2. **Handle common error codes appropriately**
3. **Display user-friendly error messages**
4. **Implement retry logic for 5xx errors**
5. **Respect rate limits**

## SDK and Tools

### cURL Examples
All documentation includes cURL examples for easy testing.

### Postman Collection
*(Coming Soon)* - Import our Postman collection for easy API testing.

### JavaScript SDK
*(Coming Soon)* - Official JavaScript SDK for easier integration.

## Changelog

### Version 1.0.0 (Current)
- **Groups API**: Complete CRUD operations
- **Authentication**: JWT-based auth system
- **Rate Limiting**: Implemented global rate limits
- **Pagination**: Consistent pagination across endpoints

## Support

- **Documentation Issues**: Please report any documentation issues
- **API Issues**: Contact the development team
- **Feature Requests**: Submit feature requests through the proper channels

## Contributing

If you find any issues with the API or documentation:

1. Check existing issues first
2. Create a detailed bug report or feature request
3. Include API endpoint, request/response examples
4. Mention your use case and expected behavior

---

*Last updated: January 23, 2025*
