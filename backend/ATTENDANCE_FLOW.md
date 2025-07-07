# Link-Based Attendance Tracking System

## Overview
This system automatically marks attendance when users click on meeting links, providing a seamless and fraud-resistant attendance tracking solution.

## Flow Diagram

```
┌─────────────────┐
│   Admin/Host    │
└────────┬────────┘
         │ Creates Session
         ▼
┌─────────────────────────────────┐
│         Session Created         │
│ • Title: Team Meeting           │
│ • Date: 2025-07-05              │
│ • Time: 10:00 - 11:00           │
│ • Meeting Link: zoom.us/j/123   │
│ • Tracking: Enabled             │
└────────┬────────────────────────┘
         │ System Generates
         ▼
┌─────────────────────────────────┐
│    Unique Tracking URLs         │
│ For each registered user:       │
│ /sessions/abc/join?token=xyz    │
└────────┬────────────────────────┘
         │ Email Sent
         ▼
┌─────────────────┐
│      User       │
│ Receives Email  │
└────────┬────────┘
         │ Clicks Link
         ▼
┌─────────────────────────────────┐
│    Attendance System Checks     │
│ ✓ Valid token?                  │
│ ✓ Within time window?           │
│ ✓ User registered?              │
│ ✓ Not already marked?           │
└────────┬────────────────────────┘
         │ If all checks pass
         ▼
┌─────────────────────────────────┐
│     Attendance Marked           │
│ • Status: Present               │
│ • Time: 2025-07-05 09:58:00    │
│ • Method: link_click            │
│ • IP: 192.168.1.100            │
└────────┬────────────────────────┘
         │ Then
         ▼
┌─────────────────────────────────┐
│   User Redirected to Meeting    │
│   zoom.us/j/123456              │
└─────────────────────────────────┘
```

## Key Features

### 1. **Time Window Validation**
- Attendance can only be marked within a configurable window (default: 15 minutes before/after session)
- Prevents early or late marking

### 2. **One-Click Process**
- User clicks link → Attendance marked → Redirected to meeting
- No manual check-in required

### 3. **Security Features**
- JWT tokens with expiration
- IP address logging
- User agent tracking
- One-time use (can't mark twice)

### 4. **Meeting Platform Support**
- Zoom
- Google Meet
- Microsoft Teams
- WebEx
- Any custom URL

### 5. **Audit Trail**
- Tracks when link was clicked
- Records IP address and browser
- Stores redirect timestamp
- Logs who marked attendance manually

## Implementation Benefits

1. **Reduces Fraud**: Can't mark attendance without actually joining
2. **Saves Time**: No manual roll call needed
3. **Accurate Timing**: Precise timestamp of when user joined
4. **Works Remotely**: Perfect for virtual meetings
5. **Analytics Ready**: Rich data for attendance patterns

## API Endpoints

```bash
# Generate attendance link
GET /api/v1/sessions/:sessionId/attendance-link

# Mark attendance via link
GET /api/v1/sessions/:sessionId/join?token=xxx

# Get session attendance
GET /api/v1/sessions/:sessionId/attendance

# Get user's attendance history
GET /api/v1/users/me/attendance

# Manual attendance marking (admin)
POST /api/v1/attendance/manual
```

## Email Template Example

```
Subject: Team Meeting - Today at 10:00 AM

Hi John,

Your team meeting is starting soon!

📅 Date: July 5, 2025
⏰ Time: 10:00 - 11:00 AM
📍 Platform: Zoom

Click below to join and mark your attendance:
[Join Meeting & Mark Attendance]

This link will automatically:
✓ Mark your attendance
✓ Redirect you to the Zoom meeting

Note: Link expires after the session ends.
```

## Future Enhancements

1. **QR Code Support**: Generate QR codes for in-person sessions
2. **Geolocation**: Verify user is at expected location
3. **Face Recognition**: Additional verification for high-security sessions
4. **Integration APIs**: Direct integration with Zoom/Teams APIs
5. **Real-time Dashboard**: Live attendance tracking for hosts
