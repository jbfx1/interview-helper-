# Interview Helper API Documentation

The Interview Helper API provides endpoints for submitting support requests, health monitoring, and administrative functions.

## Base URL

- Development: `http://localhost:4000`
- Production: `https://your-domain.com`

## Authentication

### Public Endpoints
- Health checks: No authentication required
- Support requests: No authentication required (rate limited)

### Admin Endpoints
- Basic Authentication required
- Default credentials (change in production):
  - Username: `admin`
  - Password: `admin123`
- Header: `Authorization: Basic YWRtaW46YWRtaW4xMjM=`

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Support requests**: 5 requests per 15 minutes per IP  
- **Health checks**: 60 requests per minute per IP
- **Admin endpoints**: 20 requests per 5 minutes per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when limit resets

## Endpoints

### Health & Monitoring

#### `GET /health`
Basic health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

#### `GET /health/detailed`
Comprehensive health check with system information.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "queueFile": {
      "status": "healthy",
      "path": "/app/data/support-queue.json",
      "size": 1024,
      "modified": "2024-01-15T10:25:00.000Z"
    },
    "dataIntegrity": {
      "status": "healthy",
      "totalRequests": 150,
      "validRequests": 150,
      "invalidRequests": 0
    },
    "systemResources": {
      "status": "healthy",
      "memory": {
        "rss": "45 MB",
        "heapTotal": "32 MB",
        "heapUsed": "24 MB"
      },
      "uptime": "3600 seconds"
    }
  }
}
```

#### `GET /health/ready`
Readiness check for container orchestration.

#### `GET /health/live`  
Liveness check for container orchestration.

#### `GET /health/metrics`
Application and system metrics.

### Support Requests

#### `POST /support`
Submit a new support request.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "topic": "Mock interview preparation",
  "message": "I need help preparing for system design interviews. Can we schedule a session?",
  "urgency": "normal"
}
```

**Field Validation:**
- `name`: String, minimum 2 characters
- `email`: Valid email address
- `topic`: String, minimum 3 characters  
- `message`: String, minimum 10 characters
- `urgency`: Either "normal" or "urgent"

**Success Response (201):**
```json
{
  "status": "ok",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid payload",
  "details": {
    "email": ["Provide a valid email so we can reply"],
    "message": ["Let us know a bit more (10 characters minimum)"]
  }
}
```

### Admin Endpoints

All admin endpoints require Basic Authentication and are prefixed with `/admin`.

#### `GET /admin/requests`
Retrieve support requests with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)  
- `urgency`: Filter by urgency ("normal" | "urgent")
- `search`: Search in name, email, topic, or message
- `sortBy`: Sort field ("createdAt" | "urgency" | "name")
- `sortOrder`: Sort direction ("asc" | "desc")

**Example:** `/admin/requests?page=1&limit=10&urgency=urgent&search=interview`

**Response:**
```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "topic": "Mock interview preparation", 
      "message": "I need help with system design...",
      "urgency": "urgent",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

#### `GET /admin/stats`
Get basic statistics about support requests.

**Response:**
```json
{
  "totalRequests": 150,
  "urgentRequests": 25,
  "normalRequests": 125,
  "recentRequests": 8
}
```

#### `POST /admin/backup`
Create a manual backup of data.

**Response:**
```json
{
  "message": "Backup created successfully",
  "backup": {
    "filename": "support-queue-backup-2024-01-15T10-30-00.json",
    "path": "/app/data/backups/support-queue-backup-2024-01-15T10-30-00.json",
    "metadata": {
      "timestamp": "2024-01-15T10:30:00.000Z",
      "totalRequests": 150,
      "fileSize": 15360,
      "version": "1.0"
    }
  }
}
```

#### `GET /admin/backups`
List available backups.

#### `POST /admin/backup/restore`
Restore data from a backup file.

**Request Body:**
```json
{
  "filename": "support-queue-backup-2024-01-15T10-30-00.json"
}
```

#### `POST /admin/export`
Export support request data.

**Request Body:**
```json
{
  "format": "csv",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "urgency": "urgent",
  "includeMetadata": true
}
```

**Supported Formats:**
- `json`: JSON format with optional metadata
- `csv`: Comma-separated values format

#### `GET /admin/export/stats`
Get export statistics and analytics.

#### `GET /admin/health`
Admin-specific health check with detailed system information.

## Error Handling

The API returns consistent error responses:

### HTTP Status Codes
- `200`: Success
- `201`: Created (for POST requests)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (access denied)
- `404`: Not Found
- `408`: Request Timeout
- `413`: Payload Too Large
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error
- `503`: Service Unavailable

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Human-readable error description",
  "details": {
    "field": ["Validation error message"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Security Headers

The API includes security headers in all responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (production only)
- `Content-Security-Policy` (production only)

## Request/Response Examples

### Submit Support Request
```bash
curl -X POST http://localhost:4000/support \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com", 
    "topic": "Technical interview prep",
    "message": "I would like help preparing for a technical coding interview at a FAANG company.",
    "urgency": "normal"
  }'
```

### Health Check
```bash
curl http://localhost:4000/health
```

### Admin - Get Requests
```bash
curl -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  "http://localhost:4000/admin/requests?page=1&limit=5&urgency=urgent"
```

### Admin - Create Backup  
```bash
curl -X POST \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  http://localhost:4000/admin/backup
```

### Admin - Export Data
```bash
curl -X POST \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  -H "Content-Type: application/json" \
  -d '{"format": "csv", "urgency": "urgent"}' \
  http://localhost:4000/admin/export
```

## Monitoring & Logging

The API logs all requests and includes:
- Request/response times
- Error tracking
- Security events
- Performance metrics
- Support request creation events

Logs are structured in JSON format for production and human-readable format for development.

## Development vs Production

### Development Mode
- CORS allows all origins
- Full request logging enabled
- Detailed error messages
- Pretty-printed logs

### Production Mode  
- Restricted CORS origins
- Reduced logging
- Generic error messages
- JSON structured logs
- Automatic backups enabled
- Enhanced security headers