# API Documentation

## Overview

The Post-Meeting Social Media Generator API provides endpoints for managing meetings, generating social media content, and automating post-meeting workflows.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

All API endpoints (except health check) require authentication via NextAuth.js session cookies.

## Rate Limiting

- General API: 100 requests per 15 minutes
- AI endpoints: 10 requests per minute
- Social media endpoints: 50 requests per hour
- Authentication endpoints: 5 requests per 15 minutes

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## Endpoints

### Health Check

#### GET /api/health

Check the health status of the application and its dependencies.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "external": {
      "openai": "healthy",
      "recall": "healthy",
      "google": "healthy"
    }
  },
  "uptime": 3600,
  "memory": {
    "used": 128,
    "total": 512,
    "percentage": 25
  }
}
```

### Meetings

#### GET /api/meetings

Get user's meetings with optional filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (scheduled, in-progress, completed, cancelled)
- `platform` (string): Filter by platform (zoom, teams, google-meet, webex, other)
- `startDate` (string): Filter meetings after this date (ISO 8601)
- `endDate` (string): Filter meetings before this date (ISO 8601)

**Response:**
```json
{
  "meetings": [
    {
      "id": "uuid",
      "title": "Team Standup",
      "startTime": "2024-01-15T10:00:00.000Z",
      "endTime": "2024-01-15T10:30:00.000Z",
      "platform": "zoom",
      "meetingUrl": "https://zoom.us/j/123456789",
      "attendees": ["john@example.com", "jane@example.com"],
      "description": "Daily team sync",
      "transcript": "Meeting transcript...",
      "status": "completed",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "posts": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### POST /api/meetings

Create a new meeting.

**Request Body:**
```json
{
  "title": "Team Standup",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T10:30:00.000Z",
  "platform": "zoom",
  "meetingUrl": "https://zoom.us/j/123456789",
  "attendees": ["john@example.com", "jane@example.com"],
  "description": "Daily team sync"
}
```

**Response:** 201 Created with meeting object

#### GET /api/meetings/[id]

Get a specific meeting by ID.

**Response:** Meeting object

#### PUT /api/meetings/[id]

Update a meeting.

**Request Body:** Partial meeting object

**Response:** Updated meeting object

#### DELETE /api/meetings/[id]

Delete a meeting.

**Response:** 204 No Content

### Social Media Posts

#### GET /api/posts

Get user's social media posts.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `platform` (string): Filter by platform (linkedin, facebook, twitter, instagram)
- `status` (string): Filter by status (draft, scheduled, posted, failed)
- `meetingId` (string): Filter by meeting ID

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "content": "Great meeting today! Key insights...",
      "platform": "linkedin",
      "status": "posted",
      "scheduledFor": "2024-01-15T11:00:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z",
      "meeting": {
        "id": "uuid",
        "title": "Team Standup",
        "startTime": "2024-01-15T10:00:00.000Z"
      },
      "automation": {
        "id": "uuid",
        "name": "LinkedIn Post Generator"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

#### POST /api/posts

Create a new social media post.

**Request Body:**
```json
{
  "content": "Great meeting today! Key insights...",
  "platform": "linkedin",
  "meetingId": "uuid",
  "automationId": "uuid",
  "scheduledFor": "2024-01-15T11:00:00.000Z"
}
```

**Response:** 201 Created with post object

### Automations

#### GET /api/automations

Get user's automation rules.

**Response:**
```json
{
  "automations": [
    {
      "id": "uuid",
      "name": "LinkedIn Post Generator",
      "type": "Generate post",
      "platform": "linkedin",
      "description": "Automatically generate LinkedIn posts",
      "isActive": true,
      "triggerConditions": {
        "meetingEnded": true,
        "hasTranscript": true,
        "minDuration": 15
      },
      "contentTemplate": "Template for post content",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

#### POST /api/automations

Create a new automation rule.

**Request Body:**
```json
{
  "name": "LinkedIn Post Generator",
  "type": "Generate post",
  "platform": "linkedin",
  "description": "Automatically generate LinkedIn posts",
  "isActive": true,
  "triggerConditions": {
    "meetingEnded": true,
    "hasTranscript": true,
    "minDuration": 15
  },
  "contentTemplate": "Template for post content"
}
```

**Response:** 201 Created with automation object

### AI Content Generation

#### POST /api/ai/generate-social-post

Generate social media content from meeting transcript.

**Request Body:**
```json
{
  "meetingId": "uuid",
  "platform": "linkedin",
  "automationId": "uuid",
  "tone": "professional",
  "includeHashtags": true,
  "maxLength": 280
}
```

**Response:**
```json
{
  "content": "Great discussion in today's sprint planning! Key takeaways: improved API performance, new dashboard features coming soon. Excited about the upcoming releases! #Agile #ProductDevelopment",
  "platform": "linkedin",
  "tone": "professional",
  "wordCount": 32,
  "hashtags": ["#Agile", "#ProductDevelopment"]
}
```

#### POST /api/ai/generate-email

Generate email summary from meeting transcript.

**Request Body:**
```json
{
  "meetingId": "uuid",
  "recipients": ["john@example.com", "jane@example.com"],
  "subject": "Meeting Summary - Team Standup",
  "includeActionItems": true,
  "includeTranscript": false
}
```

**Response:**
```json
{
  "subject": "Meeting Summary - Team Standup",
  "body": "Dear Team,\n\nHere's a summary of today's standup meeting...",
  "actionItems": [
    "John to finalize API documentation by Friday",
    "Jane to prepare user stories for new feature"
  ]
}
```

### Calendar Integration

#### GET /api/calendar/events

Get upcoming calendar events from Google Calendar.

**Query Parameters:**
- `timeMin` (string): Start time for events (ISO 8601)
- `timeMax` (string): End time for events (ISO 8601)
- `maxResults` (number): Maximum number of events to return

**Response:**
```json
{
  "events": [
    {
      "id": "google-event-id",
      "summary": "Team Standup",
      "start": {
        "dateTime": "2024-01-15T10:00:00.000Z"
      },
      "end": {
        "dateTime": "2024-01-15T10:30:00.000Z"
      },
      "attendees": [
        {
          "email": "john@example.com",
          "displayName": "John Doe",
          "responseStatus": "accepted"
        }
      ],
      "hangoutLink": "https://meet.google.com/abc-defg-hij",
      "description": "Daily team sync",
      "location": "Conference Room A"
    }
  ]
}
```

#### POST /api/meetings/toggle-notetaker

Enable or disable automatic notetaking for a calendar event.

**Request Body:**
```json
{
  "eventId": "google-event-id",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notetaker enabled for event",
  "botId": "recall-bot-id"
}
```

### Settings

#### GET /api/settings

Get user settings.

**Response:**
```json
{
  "id": "uuid",
  "botJoinMinutesBefore": 5,
  "defaultAutomationEnabled": true,
  "emailNotifications": true,
  "socialMediaNotifications": true,
  "timezone": "UTC",
  "language": "en"
}
```

#### PUT /api/settings

Update user settings.

**Request Body:**
```json
{
  "botJoinMinutesBefore": 10,
  "emailNotifications": false,
  "timezone": "America/New_York"
}
```

**Response:** Updated settings object

### Social Media Integration

#### POST /api/social/connect/[platform]

Connect a social media account.

**Platforms:** `linkedin`, `facebook`

**Response:**
```json
{
  "success": true,
  "message": "Account connected successfully",
  "platform": "linkedin"
}
```

#### DELETE /api/social/disconnect/[platform]

Disconnect a social media account.

**Response:**
```json
{
  "success": true,
  "message": "Account disconnected successfully",
  "platform": "linkedin"
}
```

#### POST /api/social/post

Post content to social media.

**Request Body:**
```json
{
  "content": "Post content",
  "platform": "linkedin",
  "postId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post published successfully",
  "platform": "linkedin",
  "postId": "social-post-id"
}
```

## Webhooks

### Recall.ai Webhook

#### POST /api/webhooks/recall

Receive meeting transcript updates from Recall.ai.

**Request Body:**
```json
{
  "event": "bot.recording.ready",
  "data": {
    "bot_id": "recall-bot-id",
    "meeting_id": "uuid",
    "transcript": "Meeting transcript content..."
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response:** 200 OK

## Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Authentication required
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND_ERROR`: Resource not found
- `CONFLICT_ERROR`: Resource already exists
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `EXTERNAL_SERVICE_ERROR`: External service error
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Internal server error

## Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content returned
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable
