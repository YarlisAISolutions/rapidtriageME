# WebSocket API

The RapidTriageME WebSocket API provides real-time bidirectional communication between the Chrome extension, Browser Connector, MCP server, and remote clients. This enables live streaming of browser data and interactive debugging sessions.

## Overview

WebSocket connections enable:
- **Real-time Data Streaming** - Live console logs, network requests, and errors
- **Interactive Debugging** - Bidirectional communication with browser
- **Low Latency** - Sub-millisecond response times for local connections
- **Connection Persistence** - Maintains state across page reloads

## Connection Architecture

```mermaid
graph TB
    subgraph Browser
        CE[Chrome Extension]
        WP[Web Page]
    end
    
    subgraph Local Server
        BC[Browser Connector<br/>:1421]
    end
    
    subgraph Remote Access
        CW[Cloudflare Worker<br/>rapidtriage.me]
    end
    
    subgraph AI Integration
        MCP[MCP Server]
        AI[Claude/ChatGPT]
    end
    
    CE -.->|ws://localhost:1421/extension-ws| BC
    BC -.->|ws://localhost:1421/mcp-ws| MCP
    BC -.->|wss://rapidtriage.me/tunnel/{id}| CW
    MCP -.->|MCP Protocol| AI
    
    WP -->|DevTools API| CE
```

## Local WebSocket Endpoints

### Extension Connection

#### `ws://localhost:1421/extension-ws`

Primary connection for Chrome Extension to Browser Connector.

**Connection Headers:**
```http
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Protocol: rapidtriage-extension-v1
Origin: chrome-extension://extension-id
```

**Authentication:** None (localhost only)

### MCP Server Connection

#### `ws://localhost:1421/mcp-ws`

Connection for MCP server integration with AI assistants.

**Connection Headers:**
```http
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Protocol: mcp-server-v1
User-Agent: rapidtriage-mcp/1.0
```

## Remote WebSocket Endpoints

### Secure Tunnel Connection

#### `wss://rapidtriage.me/tunnel/{sessionId}`

Encrypted tunnel for remote access through Cloudflare Worker.

**Connection Headers:**
```http
Authorization: Bearer <jwt_token>
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Protocol: rapidtriage-tunnel-v1
X-Session-ID: <session_id>
```

**Authentication:** Required JWT token

## Message Protocol

### Message Structure

All WebSocket messages follow this JSON structure:

```javascript
{
  "id": "unique-message-id",
  "type": "message-type",
  "timestamp": 1704067200000,
  "data": {
    // Message-specific payload
  },
  "metadata": {
    "sessionId": "session-123",
    "source": "chrome-extension",
    "version": "1.0"
  }
}
```

### Message Types

#### Console Messages

**Console Log**
```javascript
{
  "id": "msg_001",
  "type": "console-log",
  "timestamp": 1704067200000,
  "data": {
    "level": "info",
    "message": "Application started successfully",
    "args": ["Application", "started", { "version": "1.0" }],
    "source": "app.js:42:8",
    "stack": null
  },
  "metadata": {
    "sessionId": "session-123",
    "tabId": "tab-456",
    "url": "https://example.com"
  }
}
```

**Console Error**
```javascript
{
  "id": "msg_002", 
  "type": "console-error",
  "timestamp": 1704067200000,
  "data": {
    "level": "error",
    "message": "Uncaught TypeError: Cannot read property 'x' of undefined",
    "stack": "TypeError: Cannot read property 'x' of undefined\n    at Object.handleClick (app.js:15:5)\n    at HTMLButtonElement.onclick (index.html:1:1)",
    "source": "app.js:15:5"
  }
}
```

#### Network Messages

**Network Request**
```javascript
{
  "id": "msg_003",
  "type": "network-request",
  "timestamp": 1704067200000,
  "data": {
    "url": "https://api.example.com/users",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "duration": 145,
    "size": {
      "request": 512,
      "response": 2048
    },
    "headers": {
      "request": {
        "Authorization": "Bearer [REDACTED]",
        "Content-Type": "application/json"
      },
      "response": {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=300"
      }
    },
    "body": {
      "request": "{\"page\": 1}",
      "response": "{\"users\": [...]}"
    }
  }
}
```

**Network Error**
```javascript
{
  "id": "msg_004",
  "type": "network-error", 
  "timestamp": 1704067200000,
  "data": {
    "url": "https://api.example.com/broken",
    "method": "POST",
    "status": 500,
    "statusText": "Internal Server Error",
    "error": "Server returned 500 status",
    "duration": 5000
  }
}
```

#### Control Messages

**Heartbeat**
```javascript
{
  "id": "hb_001",
  "type": "heartbeat",
  "timestamp": 1704067200000,
  "data": {
    "status": "alive",
    "uptime": 3600000,
    "connections": 3
  }
}
```

**Screenshot Request**
```javascript
{
  "id": "cmd_001",
  "type": "screenshot-request",
  "timestamp": 1704067200000,
  "data": {
    "format": "png",
    "quality": 90,
    "fullPage": false,
    "selector": null
  }
}
```

**Screenshot Response**
```javascript
{
  "id": "cmd_001",
  "type": "screenshot-response",
  "timestamp": 1704067200000,
  "data": {
    "success": true,
    "path": "/Users/Downloads/screenshot-2024-01-01.png",
    "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "size": 150240,
    "dimensions": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

#### Element Selection

**Element Selected**
```javascript
{
  "id": "sel_001",
  "type": "element-selected",
  "timestamp": 1704067200000,
  "data": {
    "element": {
      "tagName": "DIV",
      "id": "main-content",
      "className": "container mt-4",
      "attributes": {
        "data-testid": "main",
        "role": "main"
      },
      "dimensions": {
        "width": 1200,
        "height": 800,
        "top": 100,
        "left": 0
      },
      "styles": {
        "backgroundColor": "rgb(255, 255, 255)",
        "color": "rgb(33, 37, 41)"
      },
      "innerHTML": "<h1>Welcome</h1><p>Content...</p>",
      "textContent": "Welcome Content...",
      "xpath": "/html/body/div[1]/main/div[1]",
      "cssSelector": "#main-content"
    }
  }
}
```

### Connection Management

#### Connection Established

**Client to Server:**
```javascript
{
  "type": "connection-init",
  "data": {
    "clientType": "chrome-extension",
    "version": "1.0.0",
    "capabilities": [
      "console-capture",
      "network-capture", 
      "screenshot-capture",
      "element-selection"
    ],
    "userAgent": "Chrome Extension/1.0",
    "tabId": "tab-456"
  }
}
```

**Server Response:**
```javascript
{
  "type": "connection-ack",
  "data": {
    "sessionId": "session-123",
    "serverId": "rapidtriage-server-1.0",
    "supportedProtocols": ["rapidtriage-v1"],
    "maxMessageSize": 1048576,
    "heartbeatInterval": 30000
  }
}
```

#### Connection Closed

```javascript
{
  "type": "connection-close",
  "data": {
    "reason": "client-disconnect",
    "code": 1000,
    "message": "Normal closure"
  }
}
```

## Client Implementation Examples

### JavaScript (Browser)

```javascript
class RapidTriageWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.handlers = new Map();
  }
  
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, this.options.protocol);
        
        this.ws.onopen = (event) => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.sendConnectionInit();
          resolve(event);
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };
        
        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.handleReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  sendConnectionInit() {
    this.send({
      type: 'connection-init',
      data: {
        clientType: 'javascript-client',
        version: '1.0.0',
        capabilities: ['console-capture', 'network-capture']
      }
    });
  }
  
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage = {
        id: this.generateId(),
        timestamp: Date.now(),
        ...message
      };
      
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      console.error('WebSocket not connected');
    }
  }
  
  handleMessage(message) {
    const handler = this.handlers.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.log('Unhandled message:', message);
    }
  }
  
  on(messageType, handler) {
    this.handlers.set(messageType, handler);
  }
  
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      console.log(`Reconnecting in ${delay}ms...`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }
  
  generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage example
const client = new RapidTriageWebSocket('ws://localhost:1421/extension-ws');

// Handle console logs
client.on('console-log', (message) => {
  console.log('Console log received:', message.data);
});

// Handle network requests
client.on('network-request', (message) => {
  console.log('Network request:', message.data.url, message.data.status);
});

// Connect
client.connect()
  .then(() => console.log('Connected successfully'))
  .catch(error => console.error('Connection failed:', error));
```

### Node.js Client

```javascript
const WebSocket = require('ws');

class RapidTriageMCPClient {
  constructor(url, token = null) {
    this.url = url;
    this.token = token;
    this.ws = null;
    this.sessionId = null;
  }
  
  connect() {
    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    this.ws = new WebSocket(this.url, {
      protocol: 'mcp-server-v1',
      headers: headers
    });
    
    this.ws.on('open', () => {
      console.log('MCP WebSocket connected');
      this.startHeartbeat();
    });
    
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });
    
    this.ws.on('close', (code, reason) => {
      console.log('MCP WebSocket closed:', code, reason.toString());
    });
    
    this.ws.on('error', (error) => {
      console.error('MCP WebSocket error:', error);
    });
  }
  
  startHeartbeat() {
    setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          data: { status: 'alive' }
        });
      }
    }, 30000);
  }
  
  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      const fullMessage = {
        id: `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...message
      };
      
      this.ws.send(JSON.stringify(fullMessage));
    }
  }
  
  handleMessage(message) {
    switch (message.type) {
      case 'connection-ack':
        this.sessionId = message.data.sessionId;
        console.log('Session established:', this.sessionId);
        break;
        
      case 'console-log':
        this.handleConsoleLog(message);
        break;
        
      case 'network-request':
        this.handleNetworkRequest(message);
        break;
        
      case 'screenshot-response':
        this.handleScreenshot(message);
        break;
        
      default:
        console.log('Received message:', message.type);
    }
  }
  
  handleConsoleLog(message) {
    console.log(`[${message.data.level.toUpperCase()}] ${message.data.message}`);
  }
  
  handleNetworkRequest(message) {
    const { method, url, status } = message.data;
    console.log(`${method} ${url} -> ${status}`);
  }
  
  handleScreenshot(message) {
    if (message.data.success) {
      console.log('Screenshot captured:', message.data.path);
    } else {
      console.error('Screenshot failed:', message.data.error);
    }
  }
  
  requestScreenshot(options = {}) {
    this.send({
      type: 'screenshot-request',
      data: {
        format: 'png',
        quality: 90,
        fullPage: false,
        ...options
      }
    });
  }
  
  clearLogs() {
    this.send({
      type: 'clear-logs'
    });
  }
  
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
const client = new RapidTriageMCPClient('ws://localhost:1421/mcp-ws');
client.connect();

// Request screenshot after 5 seconds
setTimeout(() => {
  client.requestScreenshot({ fullPage: true });
}, 5000);
```

### Python Client

```python
import asyncio
import json
import websockets
import time
from typing import Dict, Any, Callable, Optional

class RapidTriageWebSocketClient:
    def __init__(self, url: str, token: Optional[str] = None):
        self.url = url
        self.token = token
        self.websocket = None
        self.handlers = {}
        self.session_id = None
        
    async def connect(self):
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        try:
            self.websocket = await websockets.connect(
                self.url,
                extra_headers=headers,
                subprotocols=['rapidtriage-client-v1']
            )
            
            print("WebSocket connected")
            
            # Start message handler
            asyncio.create_task(self._message_handler())
            
            # Send connection init
            await self._send_connection_init()
            
        except Exception as e:
            print(f"Connection failed: {e}")
            raise
            
    async def _message_handler(self):
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    await self._handle_message(data)
                except json.JSONDecodeError as e:
                    print(f"Failed to parse message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            print("WebSocket connection closed")
        except Exception as e:
            print(f"Message handler error: {e}")
            
    async def _send_connection_init(self):
        await self.send({
            'type': 'connection-init',
            'data': {
                'clientType': 'python-client',
                'version': '1.0.0',
                'capabilities': [
                    'console-capture',
                    'network-capture',
                    'screenshot-capture'
                ]
            }
        })
        
    async def _handle_message(self, message: Dict[str, Any]):
        message_type = message.get('type')
        
        if message_type == 'connection-ack':
            self.session_id = message['data'].get('sessionId')
            print(f"Session established: {self.session_id}")
            
        handler = self.handlers.get(message_type)
        if handler:
            await handler(message)
        else:
            print(f"Unhandled message: {message_type}")
            
    def on(self, message_type: str, handler: Callable):
        """Register message handler"""
        self.handlers[message_type] = handler
        
    async def send(self, message: Dict[str, Any]):
        if self.websocket:
            full_message = {
                'id': f"py_{int(time.time() * 1000)}_{id(message)}",
                'timestamp': int(time.time() * 1000),
                **message
            }
            
            await self.websocket.send(json.dumps(full_message))
            
    async def request_screenshot(self, **options):
        """Request a screenshot"""
        await self.send({
            'type': 'screenshot-request',
            'data': {
                'format': 'png',
                'quality': 90,
                'fullPage': False,
                **options
            }
        })
        
    async def clear_logs(self):
        """Clear all captured logs"""
        await self.send({
            'type': 'clear-logs'
        })
        
    async def close(self):
        if self.websocket:
            await self.websocket.close()

# Usage example
async def main():
    client = RapidTriageWebSocketClient('ws://localhost:1421/mcp-ws')
    
    # Register handlers
    async def handle_console_log(message):
        data = message['data']
        print(f"[{data['level'].upper()}] {data['message']}")
        
    async def handle_network_request(message):
        data = message['data']
        print(f"{data['method']} {data['url']} -> {data['status']}")
        
    async def handle_screenshot(message):
        data = message['data']
        if data['success']:
            print(f"Screenshot saved: {data['path']}")
        else:
            print(f"Screenshot failed: {data.get('error')}")
            
    client.on('console-log', handle_console_log)
    client.on('network-request', handle_network_request) 
    client.on('screenshot-response', handle_screenshot)
    
    # Connect and run
    await client.connect()
    
    # Request screenshot after 5 seconds
    await asyncio.sleep(5)
    await client.request_screenshot(fullPage=True)
    
    # Keep connection alive
    await asyncio.sleep(60)
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
```

## Authentication & Security

### JWT Token Authentication

For remote connections, include JWT token in connection headers:

```javascript
const ws = new WebSocket('wss://rapidtriage.me/tunnel/session123', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

### Origin Validation

Server validates connection origins:

```javascript
// Server-side origin validation
function validateOrigin(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'chrome-extension://extension-id',
    'http://localhost:1421',
    'https://rapidtriage.me'
  ];
  
  return allowedOrigins.includes(origin);
}
```

## Error Handling

### Connection Errors

```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  
  // Handle specific error types
  if (error.code === 1006) {
    console.log('Connection closed abnormally - attempting reconnect');
    setTimeout(reconnect, 5000);
  }
};
```

### Message Validation

```javascript
function validateMessage(message) {
  if (!message.id || !message.type || !message.timestamp) {
    throw new Error('Invalid message format');
  }
  
  if (typeof message.timestamp !== 'number') {
    throw new Error('Invalid timestamp');
  }
  
  if (Date.now() - message.timestamp > 60000) {
    throw new Error('Message too old');
  }
  
  return true;
}
```

## Performance Considerations

### Message Throttling

```javascript
class MessageThrottler {
  constructor(maxPerSecond = 100) {
    this.maxPerSecond = maxPerSecond;
    this.messageCount = 0;
    this.windowStart = Date.now();
  }
  
  canSend() {
    const now = Date.now();
    
    // Reset counter every second
    if (now - this.windowStart >= 1000) {
      this.messageCount = 0;
      this.windowStart = now;
    }
    
    return this.messageCount < this.maxPerSecond;
  }
  
  recordMessage() {
    this.messageCount++;
  }
}
```

### Connection Pooling

```javascript
class WebSocketPool {
  constructor(url, maxConnections = 5) {
    this.url = url;
    this.maxConnections = maxConnections;
    this.connections = [];
    this.currentIndex = 0;
  }
  
  async getConnection() {
    if (this.connections.length < this.maxConnections) {
      const ws = new WebSocket(this.url);
      await this.waitForConnection(ws);
      this.connections.push(ws);
      return ws;
    }
    
    // Round-robin existing connections
    const connection = this.connections[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.connections.length;
    return connection;
  }
  
  async waitForConnection(ws) {
    return new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
  }
}
```

## Troubleshooting

### Common Issues

??? bug "Connection refused or timeout"
    **Symptoms:** Cannot establish WebSocket connection
    **Solutions:**
    - Verify server is running on correct port
    - Check firewall settings
    - Confirm WebSocket endpoint URL
    ```bash
    # Test with wscat
    npm install -g wscat
    wscat -c ws://localhost:1421/extension-ws
    ```

??? bug "Messages not being received"
    **Symptoms:** Connection established but no data flow
    **Solutions:**
    - Check message format validation
    - Verify handler registration
    - Enable debug logging
    - Test with simple message types first

??? bug "Frequent disconnections"
    **Symptoms:** Connection drops repeatedly
    **Solutions:**
    - Implement proper heartbeat/ping-pong
    - Check network stability
    - Increase connection timeout
    - Add exponential backoff for reconnection

### Debug Tools

```bash
# Monitor WebSocket traffic
wscat -c ws://localhost:1421/extension-ws -x '{"type":"heartbeat"}'

# Check connection with curl
curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     --header "Sec-WebSocket-Version: 13" \
     http://localhost:1421/extension-ws

# Network debugging
netstat -an | grep 1421
lsof -i :1421
```

## Next Steps

- [REST API](rest.md) - HTTP API endpoints
- [MCP Protocol](mcp.md) - AI integration protocol  
- [Security Guide](../guides/security.md) - WebSocket security
- [Performance Guide](../guides/performance.md) - Optimization tips