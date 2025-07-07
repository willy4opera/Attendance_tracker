# Session Model Updates for Link-Based Attendance

## Database Schema Changes

### Sessions Table Additions:
```sql
- meetingLink: STRING (Zoom, Google Meet URL)
- meetingType: ENUM ('zoom', 'google_meet', 'teams', 'other')
- trackingEnabled: BOOLEAN (default: true)
- attendanceWindow: INTEGER (minutes before/after session to allow marking)
```

### Attendance Table Additions:
```sql
- markedVia: ENUM ('link_click', 'manual', 'qr_code')
- ipAddress: STRING
- userAgent: STRING
- clickTimestamp: TIMESTAMP
```

## Implementation Flow:

1. **Tracking URL Generation**:
   ```
   /api/v1/sessions/{sessionId}/join?token={unique_token}
   ```

2. **Attendance Marking Process**:
   - Validate session is active (within time window)
   - Check if user already marked attendance
   - Record attendance with metadata
   - Redirect to actual meeting link

3. **Security Considerations**:
   - Time-based tokens
   - IP tracking for audit
   - Rate limiting per user
   - Session-specific tokens
