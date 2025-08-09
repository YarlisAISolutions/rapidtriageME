# REST API Reference

The Browser Connector Server exposes a RESTful API for retrieving browser data and controlling debugging sessions.

## Base URL

- **Local**: `http://localhost:1421`
- **Remote**: `https://rapidtriage.me`

## Authentication

### Local Access
No authentication required for localhost connections.

### Remote Access
Include JWT token in Authorization header:
```http
Authorization: Bearer <jwt_token>
```

## Endpoints

### Server Identity

#### `GET /.identity`

Returns server information and validates the connection.

**Response:**
```json
{
  "port": 1421,
  "name": "rapidtriage-server",
  "version": "1.2.0",
  "signature": "mcp-browser-connector-24x7"
}
```

---

### Console Logs

#### `GET /console-logs`

Retrieves all captured console logs.

**Query Parameters:**
- `limit` (optional): Maximum number of logs to return (default: 50)
- `level` (optional): Filter by log level (log, warn, error, info)

**Response:**
```json
{
  "logs": [
    {
      "type": "console-log",
      "level": "info",
      "message": "Application initialized",
      "timestamp": 1704067200000,
      "source": "app.js:42"
    }
  ],
  "count": 1,
  "truncated": false
}
```

---

### Console Errors

#### `GET /console-errors`

Retrieves only console errors and exceptions.

**Response:**
```json
{
  "errors": [
    {
      "type": "console-error",
      "message": "Uncaught TypeError: Cannot read property 'x' of undefined",
      "stack": "at Object.<anonymous> (app.js:15:5)",
      "timestamp": 1704067200000
    }
  ],
  "count": 1
}
```

---

### Network Requests

#### `GET /network-success`

Retrieves successful network requests.

**Query Parameters:**
- `limit` (optional): Maximum number of requests (default: 50)
- `method` (optional): Filter by HTTP method

**Response:**
```json
{
  "requests": [
    {
      "url": "https://api.example.com/data",
      "method": "GET",
      "status": 200,
      "duration": 145,
      "size": 2048,
      "timestamp": 1704067200000,
      "requestHeaders": {},
      "responseHeaders": {}
    }
  ],
  "count": 1
}
```

---

#### `GET /network-errors`

Retrieves failed network requests.

**Response:**
```json
{
  "errors": [
    {
      "url": "https://api.example.com/broken",
      "method": "POST",
      "status": 500,
      "error": "Internal Server Error",
      "timestamp": 1704067200000
    }
  ],
  "count": 1
}
```

---

### Screenshot Capture

#### `POST /capture-screenshot`

Captures a screenshot of the current browser tab.

**Request Body:**
```json
{
  "format": "png",
  "quality": 90,
  "fullPage": false
}
```

**Response:**
```json
{
  "success": true,
  "path": "/Users/downloads/screenshot-2024-01-01.png",
  "size": 150240,
  "dimensions": {
    "width": 1920,
    "height": 1080
  }
}
```

---

### Selected Element

#### `GET /selected-element`

Returns information about the currently selected element in DevTools.

**Response:**
```json
{
  "element": {
    "tagName": "DIV",
    "id": "main-content",
    "className": "container mt-4",
    "attributes": {
      "data-testid": "main"
    },
    "dimensions": {
      "width": 1200,
      "height": 800,
      "top": 100,
      "left": 0
    },
    "innerHTML": "...",
    "textContent": "..."
  }
}
```

---

### Audit Endpoints

#### `POST /accessibility-audit`

Runs a Lighthouse accessibility audit on the current page.

**Request Body:**
```json
{
  "url": "https://example.com",
  "options": {
    "formFactor": "desktop",
    "screenEmulation": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

**Response:**
```json
{
  "score": 0.95,
  "audits": {
    "aria-valid-attr": {
      "score": 1,
      "title": "ARIA attributes are valid"
    },
    "color-contrast": {
      "score": 0.8,
      "title": "Background and foreground colors have sufficient contrast ratio",
      "details": []
    }
  },
  "categories": {
    "accessibility": {
      "score": 0.95,
      "title": "Accessibility"
    }
  }
}
```

---

#### `POST /performance-audit`

Runs a Lighthouse performance audit.

**Response:**
```json
{
  "score": 0.89,
  "metrics": {
    "firstContentfulPaint": 1200,
    "largestContentfulPaint": 2500,
    "timeToInteractive": 3500,
    "speedIndex": 2800,
    "totalBlockingTime": 150,
    "cumulativeLayoutShift": 0.05
  },
  "opportunities": [
    {
      "id": "unused-css",
      "title": "Remove unused CSS",
      "savings": 15240
    }
  ]
}
```

---

### Session Management

#### `POST /wipelogs`

Clears all captured logs and data.

**Response:**
```json
{
  "message": "All logs have been wiped",
  "timestamp": 1704067200000
}
```

---

#### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "service": "RapidTriageME"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required parameter: url",
    "details": {}
  },
  "timestamp": 1704067200000
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Malformed or missing parameters |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `INTERNAL_ERROR` | Server error |
| `RATE_LIMITED` | Too many requests |

## Rate Limiting

- **Local**: No rate limiting
- **Remote**: 100 requests per minute per IP

## WebSocket Endpoints

### `ws://localhost:1421/extension-ws`

WebSocket connection for real-time data streaming.

**Message Types:**
- `heartbeat` - Keep-alive
- `console-log` - Console output
- `network-request` - Network activity
- `screenshot-request` - Screenshot trigger

## Examples

### cURL Examples

```bash
# Get console logs
curl http://localhost:1421/console-logs

# Take screenshot
curl -X POST http://localhost:1421/capture-screenshot

# Run accessibility audit
curl -X POST http://localhost:1421/accessibility-audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Clear all logs
curl -X POST http://localhost:1421/wipelogs
```

### JavaScript Examples

```javascript
// Fetch console logs
const response = await fetch('http://localhost:1421/console-logs');
const data = await response.json();
console.log(data.logs);

// Take screenshot
const screenshot = await fetch('http://localhost:1421/capture-screenshot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullPage: true })
});
const result = await screenshot.json();
console.log('Screenshot saved:', result.path);
```

## SDK Support

Official SDKs available:
- Node.js: `npm install @yarlisai/rapidtriage-sdk`
- Python: `pip install rapidtriage`
- Go: `go get -go`

## Next Steps

- [WebSocket API](websocket.md) - Real-time communication
- [MCP Protocol](mcp.md) - AI integration protocol
- [Authentication](../guides/security.md) - Security implementation