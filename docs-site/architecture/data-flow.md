# Data Flow Architecture

This document details how data flows through the RapidTriageME system, from browser events to AI assistant responses. Understanding these patterns is crucial for debugging, optimization, and extending the platform.

## Overview

RapidTriageME processes data through multiple interconnected flows:

```mermaid
graph TB
    subgraph "Data Sources"
        BROWSER[Browser Events]
        USER[User Actions]
        PAGE[Page Changes]
    end
    
    subgraph "Collection Layer"
        EXT[Chrome Extension]
        DEVTOOLS[DevTools API]
        CONTENT[Content Scripts]
    end
    
    subgraph "Processing Layer"
        WS[WebSocket Handler]
        PROC[Data Processor]
        CACHE[Cache Manager]
        FILTER[Data Filter]
    end
    
    subgraph "Integration Layer"
        REST[REST API]
        MCP[MCP Server]
        LH[Lighthouse Runner]
    end
    
    subgraph "Output Layer"
        AI[AI Assistant]
        DASH[Dashboard]
        WEBHOOK[Webhooks]
    end
    
    BROWSER --> EXT
    USER --> EXT
    PAGE --> DEVTOOLS
    
    EXT --> WS
    DEVTOOLS --> CONTENT
    CONTENT --> WS
    
    WS --> PROC
    PROC --> CACHE
    PROC --> FILTER
    
    CACHE --> REST
    REST --> MCP
    REST --> LH
    
    MCP --> AI
    REST --> DASH
    REST --> WEBHOOK
    
    style BROWSER fill:#e3f2fd
    style EXT fill:#e1f5fe
    style PROC fill:#e8f5e8
    style MCP fill:#fff3e0
    style AI fill:#f1f8e9
```

## Real-Time Data Flows

### Console Log Flow

Console messages flow from browser to AI assistant through this pipeline:

```mermaid
sequenceDiagram
    participant JS as JavaScript Code
    participant CONSOLE as Console API
    participant EXT as Extension
    participant BC as Browser Connector
    participant CACHE as Memory Cache
    participant MCP as MCP Server
    participant AI as AI Assistant
    
    JS->>CONSOLE: console.log("message")
    CONSOLE->>EXT: Console Event
    EXT->>EXT: Capture & Format
    EXT->>BC: WebSocket Message
    BC->>BC: Validate & Enrich
    BC->>CACHE: Store Log Entry
    
    Note over AI,MCP: AI requests logs
    AI->>MCP: get_console_logs
    MCP->>BC: GET /console-logs
    BC->>CACHE: Query Recent Logs
    CACHE-->>BC: Log Entries
    BC-->>MCP: Formatted Logs
    MCP-->>AI: Console Analysis
```

**Data Transformation:**
```javascript
// Raw console event
{
  level: "error",
  message: "TypeError: Cannot read property 'foo' of undefined",
  timestamp: 1704067200000,
  stack: "Error\n    at example.js:15:20"
}

// Processed log entry
{
  id: "log_abc123",
  level: "error",
  message: "TypeError: Cannot read property 'foo' of undefined",
  timestamp: 1704067200000,
  url: "https://example.com/page",
  source: "example.js:15:20",
  stack: ["Error", "    at example.js:15:20"],
  metadata: {
    userAgent: "Chrome/91.0",
    sessionId: "session_xyz789"
  }
}
```

### Network Request Flow

Network requests are captured and analyzed through this flow:

```mermaid
sequenceDiagram
    participant PAGE as Web Page
    participant BROWSER as Browser
    participant EXT as Extension
    participant BC as Browser Connector
    participant PROC as Data Processor
    participant AI as AI Assistant
    
    PAGE->>BROWSER: fetch('/api/data')
    BROWSER->>BROWSER: Execute Request
    BROWSER->>EXT: Network Event (DevTools)
    EXT->>EXT: Capture Request/Response
    EXT->>BC: WebSocket: network-request
    BC->>PROC: Process Network Data
    PROC->>PROC: Extract Timing, Headers, Body
    PROC->>BC: Store Processed Request
    
    Note over AI,BC: AI analyzes network issues
    AI->>BC: GET /network-requests?status=error
    BC-->>AI: Failed Requests Analysis
```

**Network Data Structure:**
```javascript
// Network request entry
{
  id: "req_def456",
  url: "https://api.example.com/data",
  method: "GET",
  status: 500,
  statusText: "Internal Server Error",
  timestamp: 1704067200000,
  duration: 2500, // milliseconds
  size: {
    request: 1024,
    response: 256
  },
  timing: {
    dns: 50,
    connect: 100,
    send: 10,
    wait: 2000,
    receive: 340
  },
  headers: {
    request: { "Content-Type": "application/json" },
    response: { "Content-Type": "application/json" }
  },
  body: {
    request: "{\"query\":\"test\"}",
    response: "{\"error\":\"Database connection failed\"}"
  }
}
```

### Screenshot Capture Flow

Screenshot requests follow this synchronous pattern:

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant MCP as MCP Server
    participant BC as Browser Connector
    participant EXT as Extension
    participant PAGE as Web Page
    
    AI->>MCP: screenshot_capture
    MCP->>BC: POST /capture-screenshot
    BC->>EXT: WebSocket: screenshot-request
    EXT->>PAGE: Capture DOM
    PAGE-->>EXT: Canvas Data
    EXT->>EXT: Convert to Base64
    EXT-->>BC: Screenshot Data
    BC->>BC: Optimize & Validate
    BC-->>MCP: Base64 Image
    MCP-->>AI: Image + Metadata
```

## Asynchronous Processing Patterns

### Event Buffering

High-frequency events are buffered to prevent overwhelming the system:

```mermaid
graph LR
    EVENTS[Browser Events] --> BUFFER[Event Buffer]
    BUFFER --> BATCH[Batch Processor]
    BATCH --> FILTER[Filter & Dedupe]
    FILTER --> STORE[Storage]
    
    subgraph "Buffer Management"
        SIZE[Size Limit: 1000]
        TIME[Time Window: 1s]
        PRIORITY[Priority Queue]
    end
    
    BUFFER --> SIZE
    BUFFER --> TIME
    BUFFER --> PRIORITY
```

**Buffer Implementation:**
```javascript
class EventBuffer {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.flushInterval = options.flushInterval || 1000;
    this.buffer = [];
    this.flushTimer = null;
  }

  add(event) {
    this.buffer.push({
      ...event,
      bufferedAt: Date.now()
    });

    // Flush if buffer is full
    if (this.buffer.length >= this.maxSize) {
      this.flush();
    } else if (!this.flushTimer) {
      // Schedule flush
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, this.flushInterval);
    }
  }

  flush() {
    if (this.buffer.length === 0) return;

    const events = this.buffer.splice(0, this.buffer.length);
    this.processEvents(events);
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
```

### Data Aggregation

Multiple data sources are aggregated for comprehensive analysis:

```mermaid
graph TB
    subgraph "Data Sources"
        CONSOLE[Console Logs]
        NETWORK[Network Requests]
        ERRORS[JavaScript Errors]
        PERF[Performance Metrics]
    end
    
    subgraph "Aggregation Layer"
        TIMELINE[Timeline Aggregator]
        CORRELATE[Event Correlator]
        PATTERN[Pattern Detector]
    end
    
    subgraph "Analysis Output"
        SUMMARY[Session Summary]
        INSIGHTS[Performance Insights]
        ISSUES[Issue Detection]
    end
    
    CONSOLE --> TIMELINE
    NETWORK --> TIMELINE
    ERRORS --> TIMELINE
    PERF --> TIMELINE
    
    TIMELINE --> CORRELATE
    CORRELATE --> PATTERN
    
    PATTERN --> SUMMARY
    PATTERN --> INSIGHTS
    PATTERN --> ISSUES
```

## Lighthouse Audit Flow

Lighthouse audits follow a specialized processing pipeline:

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant MCP as MCP Server
    participant BC as Browser Connector
    participant LH as Lighthouse Runner
    participant CHROME as Chrome Instance
    participant TARGET as Target Page
    
    AI->>MCP: run_lighthouse_audit
    MCP->>BC: POST /lighthouse-audit
    BC->>LH: Launch Audit
    LH->>CHROME: Start Chrome Instance
    CHROME->>TARGET: Navigate to URL
    TARGET-->>CHROME: Page Content
    CHROME->>CHROME: Run Audits
    CHROME-->>LH: Audit Results
    LH->>LH: Process & Format
    LH-->>BC: Structured Results
    BC-->>MCP: Audit Report
    MCP-->>AI: Performance Analysis
```

**Lighthouse Data Processing:**
```javascript
// Raw Lighthouse result processing
function processLighthouseResults(lhr) {
  return {
    url: lhr.finalUrl,
    timestamp: new Date(lhr.fetchTime).getTime(),
    
    // Core scores (0-100)
    scores: {
      performance: Math.round((lhr.categories.performance?.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((lhr.categories.seo?.score || 0) * 100)
    },
    
    // Core Web Vitals
    metrics: {
      firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue,
      largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue,
      cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue,
      totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue
    },
    
    // Opportunities for improvement
    opportunities: extractOpportunities(lhr.audits),
    
    // Diagnostics and issues
    diagnostics: extractDiagnostics(lhr.audits)
  };
}
```

## Error Handling and Recovery

### Connection Recovery

WebSocket connections implement automatic recovery:

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting: initialize()
    Connecting --> Connected: onopen
    Connecting --> Failed: onerror
    Connected --> Disconnected: onclose
    Failed --> Waiting: exponential backoff
    Waiting --> Connecting: retry timer
    Connected --> Reconnecting: connection lost
    Reconnecting --> Connected: reconnect success
    Reconnecting --> Failed: reconnect fail
    
    Connected: Queue data\nSend messages
    Disconnected: Buffer events\nShow offline status
    Failed: Log errors\nSchedule retry
```

### Data Persistence

Critical data is persisted during connection issues:

```javascript
class DataPersistence {
  constructor() {
    this.offlineQueue = [];
    this.maxOfflineSize = 10000; // entries
    this.persistenceKey = 'rapidtriage_offline_data';
  }

  // Buffer data when offline
  bufferOfflineData(data) {
    this.offlineQueue.push({
      ...data,
      queuedAt: Date.now()
    });

    // Maintain size limits
    if (this.offlineQueue.length > this.maxOfflineSize) {
      this.offlineQueue = this.offlineQueue.slice(-this.maxOfflineSize);
    }

    // Persist to local storage
    this.persistToStorage();
  }

  // Sync when connection restored
  async syncOfflineData() {
    const queuedData = this.offlineQueue.splice(0);
    
    for (const data of queuedData) {
      try {
        await this.sendData(data);
      } catch (error) {
        // Re-queue failed items
        this.offlineQueue.unshift(data);
        break;
      }
    }

    this.persistToStorage();
  }
}
```

## Performance Optimization

### Data Compression

Large payloads are compressed before transmission:

```mermaid
graph LR
    RAW[Raw Data] --> COMPRESS[Compression]
    COMPRESS --> TRANSMIT[WebSocket]
    TRANSMIT --> DECOMPRESS[Decompression]
    DECOMPRESS --> PROCESS[Processing]
    
    subgraph "Compression Options"
        GZIP[GZIP]
        BROTLI[Brotli]
        CUSTOM[Custom Delta]
    end
    
    COMPRESS --> GZIP
    COMPRESS --> BROTLI
    COMPRESS --> CUSTOM
```

### Streaming Responses

Large datasets are streamed to prevent memory issues:

```javascript
// Streaming log retrieval
async function* streamConsoleLogs(options = {}) {
  const batchSize = options.batchSize || 100;
  let offset = 0;
  
  while (true) {
    const batch = await this.getLogsBatch(offset, batchSize);
    
    if (batch.length === 0) break;
    
    // Yield batch to consumer
    yield {
      logs: batch,
      offset,
      hasMore: batch.length === batchSize
    };
    
    offset += batch.length;
  }
}

// Usage in API endpoint
app.get('/console-logs/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chunked'
  });
  
  for await (const batch of streamConsoleLogs()) {
    res.write(JSON.stringify(batch) + '\n');
  }
  
  res.end();
});
```

## Data Security and Privacy

### Sensitive Data Filtering

Personal and sensitive information is filtered at multiple stages:

```mermaid
graph TB
    INPUT[Raw Data] --> DETECT[Pattern Detection]
    DETECT --> CLASSIFY[Data Classification]
    CLASSIFY --> MASK[Masking/Redaction]
    MASK --> VALIDATE[Validation]
    VALIDATE --> OUTPUT[Clean Data]
    
    subgraph "Sensitive Patterns"
        EMAIL[Email Addresses]
        PHONE[Phone Numbers]
        CC[Credit Cards]
        SSN[Social Security]
        TOKEN[API Tokens]
    end
    
    DETECT --> EMAIL
    DETECT --> PHONE
    DETECT --> CC
    DETECT --> SSN
    DETECT --> TOKEN
```

**Data Sanitization Pipeline:**
```javascript
class DataSanitizer {
  constructor() {
    this.patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      apiKey: /\b[A-Za-z0-9]{32,}\b/g
    };
  }

  sanitize(data) {
    let sanitized = JSON.stringify(data);
    
    for (const [type, pattern] of Object.entries(this.patterns)) {
      sanitized = sanitized.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
    }
    
    return JSON.parse(sanitized);
  }
}
```

## Monitoring and Observability

### Flow Metrics

Key metrics are tracked throughout the data flow:

```mermaid
graph TB
    subgraph "Input Metrics"
        EVENTS[Events/sec]
        BYTES[Bytes/sec]
        ERRORS[Error Rate]
    end
    
    subgraph "Processing Metrics"
        LATENCY[Processing Latency]
        QUEUE[Queue Depth]
        MEMORY[Memory Usage]
    end
    
    subgraph "Output Metrics"
        API_CALLS[API Calls/min]
        SUCCESS[Success Rate]
        CACHE_HIT[Cache Hit Rate]
    end
    
    EVENTS --> LATENCY
    BYTES --> QUEUE
    ERRORS --> MEMORY
    
    LATENCY --> API_CALLS
    QUEUE --> SUCCESS
    MEMORY --> CACHE_HIT
```

### Distributed Tracing

Requests are traced across all components:

```javascript
// Trace context propagation
class TraceContext {
  constructor(traceId = generateTraceId()) {
    this.traceId = traceId;
    this.spanId = generateSpanId();
    this.startTime = Date.now();
    this.events = [];
  }

  addEvent(name, data = {}) {
    this.events.push({
      name,
      timestamp: Date.now(),
      duration: Date.now() - this.startTime,
      data
    });
  }

  createChildSpan(name) {
    return new TraceContext(this.traceId)
      .setParentSpan(this.spanId)
      .setName(name);
  }
}

// Usage in data flow
const trace = new TraceContext();

// Extension
trace.addEvent('console_log_captured', { level: 'error' });

// Browser Connector
trace.addEvent('websocket_received');
trace.addEvent('data_processed');

// MCP Server
trace.addEvent('mcp_tool_executed', { tool: 'get_console_logs' });
```

This comprehensive data flow architecture ensures reliable, performant, and secure processing of browser debugging data from capture to AI analysis.

## Next Steps

- **[Component Details](components.md)** - Deep dive into component internals
- **[API Reference](../api/index.md)** - Detailed API documentation
- **[Performance Guide](../guides/performance.md)** - Optimization strategies