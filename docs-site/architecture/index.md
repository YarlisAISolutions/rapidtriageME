# Architecture Overview

RapidTriageME is designed with a modular, distributed architecture that enables seamless AI-powered browser debugging. This section provides a comprehensive overview of the system design, component interactions, and architectural decisions.

## System Architecture

### High-Level Overview

```mermaid
graph TB
    subgraph "Browser Environment"
        WP[Web Page]
        CE[Chrome Extension]
        DT[DevTools API]
        WP -->|DOM Events| DT
        DT -->|Browser Data| CE
    end
    
    subgraph "Local Environment"
        BC[Browser Connector<br/>Port 1421]
        MCP[MCP Server]
        CE -->|WebSocket| BC
        BC <-->|HTTP/REST| MCP
    end
    
    subgraph "Cloud Infrastructure"
        CF[Cloudflare Worker]
        KV[(KV Storage)]
        DO[Durable Objects]
        CF --> KV
        CF --> DO
    end
    
    subgraph "AI Integration Layer"
        IDE[IDE/Editor]
        Claude[Claude Desktop]
        API[AI APIs]
        MCP -->|MCP Protocol| IDE
        MCP -->|MCP Protocol| Claude
        MCP -->|HTTP/SSE| API
    end
    
    BC -.->|Optional Remote| CF
    CF -.->|Webhook/SSE| API
    
    style WP fill:#e3f2fd
    style CE fill:#f3e5f5
    style BC fill:#e8f5e8
    style MCP fill:#fff3e0
    style CF fill:#fce4ec
    style IDE fill:#f1f8e9
```

## Core Design Principles

### 1. Modularity
Each component has a single, well-defined responsibility:
- **Chrome Extension** - Browser data capture only
- **Browser Connector** - Data processing and aggregation
- **MCP Server** - AI integration abstraction
- **Cloudflare Worker** - Remote access and scaling

### 2. Loose Coupling
Components communicate through well-defined interfaces:
- WebSocket for real-time browser communication
- REST API for request/response patterns
- MCP protocol for AI assistant integration
- SSE for server-to-client streaming

### 3. Fault Tolerance
The system gracefully handles failures:
- Connection loss auto-recovery
- Data persistence during disconnections
- Fallback mechanisms for cloud services
- Graceful degradation of features

### 4. Extensibility
New features can be added without major changes:
- Plugin system for custom tools
- Configurable audit categories
- Custom MCP tool definitions
- Webhook integration points

## Component Architecture

### Chrome Extension Layer

```mermaid
graph LR
    subgraph "Chrome Extension"
        BG[Background Script]
        CS[Content Script]
        DT[DevTools Panel]
        PP[Popup UI]
        
        BG <--> CS
        BG <--> DT
        BG <--> PP
    end
    
    subgraph "Browser APIs"
        DTAPI[DevTools API]
        WSAPI[WebSocket API]
        STORAGEAPI[Storage API]
    end
    
    DT --> DTAPI
    BG --> WSAPI
    PP --> STORAGEAPI
```

**Key Components:**
- **Background Script** - Manages WebSocket connections and data flow
- **DevTools Panel** - User interface within Chrome DevTools
- **Content Script** - Injects monitoring code into web pages
- **Popup UI** - Extension configuration and status interface

### Local Server Layer

```mermaid
graph TB
    subgraph "Browser Connector Server"
        WS[WebSocket Handler]
        HTTP[HTTP Server]
        PROC[Data Processor]
        CACHE[Memory Cache]
        LH[Lighthouse Runner]
        
        WS --> PROC
        HTTP --> PROC
        PROC --> CACHE
        PROC --> LH
    end
    
    subgraph "External Services"
        CHROME[Chrome/Chromium]
        PUPPETEER[Puppeteer]
    end
    
    LH --> CHROME
    LH --> PUPPETEER
```

**Key Features:**
- **Real-time Processing** - Immediate data transformation and filtering
- **Caching** - In-memory storage for recent browser data
- **Lighthouse Integration** - Performance and accessibility audits
- **Multi-session Support** - Handle multiple browser connections

### MCP Integration Layer

```mermaid
graph LR
    subgraph "MCP Server"
        TOOLS[Tool Registry]
        HANDLER[Request Handler]
        TRANSPORT[Transport Layer]
        VALIDATOR[Input Validator]
        
        TRANSPORT --> HANDLER
        HANDLER --> VALIDATOR
        HANDLER --> TOOLS
    end
    
    subgraph "AI Clients"
        CURSOR[Cursor IDE]
        CLAUDE[Claude Desktop]
        VSC[VS Code]
        ZED[Zed Editor]
    end
    
    TRANSPORT <--> CURSOR
    TRANSPORT <--> CLAUDE
    TRANSPORT <--> VSC
    TRANSPORT <--> ZED
```

**Tool Categories:**
- **Browser Control** - Navigation, screenshot capture
- **Data Retrieval** - Console logs, network requests
- **Analysis Tools** - Performance audits, accessibility checks
- **Debugging Utilities** - Element inspection, JavaScript execution

## Data Flow Architecture

### Request Flow Patterns

#### 1. Synchronous Tool Execution

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant MCP as MCP Server
    participant BC as Browser Connector
    participant EXT as Chrome Extension
    
    AI->>MCP: Take Screenshot
    MCP->>BC: POST /screenshot
    BC->>EXT: Screenshot Request (WebSocket)
    EXT->>EXT: Capture Screenshot
    EXT-->>BC: Screenshot Data
    BC-->>MCP: Base64 Image
    MCP-->>AI: Tool Response
```

#### 2. Asynchronous Data Streaming

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant MCP as MCP Server
    participant BC as Browser Connector
    participant EXT as Chrome Extension
    participant PAGE as Web Page
    
    PAGE->>EXT: Console Error
    EXT->>BC: Log Event (WebSocket)
    BC->>BC: Store in Cache
    AI->>MCP: Get Console Logs
    MCP->>BC: GET /console-logs
    BC-->>MCP: Recent Logs
    MCP-->>AI: Formatted Response
```

### Data Transformation Pipeline

```mermaid
graph LR
    RAW[Raw Browser Data] --> FILTER[Filter & Sanitize]
    FILTER --> TRANSFORM[Transform Structure]
    TRANSFORM --> ENRICH[Enrich Metadata]
    ENRICH --> CACHE[Cache Storage]
    CACHE --> FORMAT[Format for MCP]
    FORMAT --> RESPONSE[Tool Response]
    
    style RAW fill:#ffebee
    style FILTER fill:#e8f5e8
    style TRANSFORM fill:#e3f2fd
    style ENRICH fill:#fff3e0
    style CACHE fill:#f3e5f5
    style FORMAT fill:#e1f5fe
    style RESPONSE fill:#f1f8e9
```

## Deployment Architectures

### Local Development Architecture

```mermaid
graph TB
    subgraph "Developer Machine"
        BROWSER[Chrome Browser]
        EXT[Extension]
        SERVER[Local Server :1421]
        MCP[MCP Server]
        IDE[IDE/Editor]
        
        BROWSER <--> EXT
        EXT <--> SERVER
        SERVER <--> MCP
        MCP <--> IDE
    end
    
    style BROWSER fill:#e3f2fd
    style SERVER fill:#e8f5e8
    style MCP fill:#fff3e0
    style IDE fill:#f1f8e9
```

**Benefits:**
- Ultra-low latency
- Complete privacy
- No internet dependency
- Simple debugging

### Hybrid Architecture

```mermaid
graph TB
    subgraph "Local Environment"
        BROWSER[Chrome Browser]
        EXT[Extension]
        SERVER[Local Server :1421]
        
        BROWSER <--> EXT
        EXT <--> SERVER
    end
    
    subgraph "Cloud Environment"
        CF[Cloudflare Worker]
        KV[(KV Storage)]
        DO[Durable Objects]
        
        CF --> KV
        CF --> DO
    end
    
    subgraph "AI Services"
        MCP[Remote MCP]
        API[AI APIs]
        
        MCP <--> API
    end
    
    SERVER <--> CF
    CF <--> MCP
    
    style BROWSER fill:#e3f2fd
    style SERVER fill:#e8f5e8
    style CF fill:#fce4ec
    style MCP fill:#fff3e0
```

**Benefits:**
- Local data capture
- Remote processing power
- Global accessibility
- Team collaboration

### Full Cloud Architecture

```mermaid
graph TB
    subgraph "Edge Network"
        CDN[Cloudflare CDN]
        WORKER[Cloudflare Worker]
        KV[(KV Storage)]
        DO[Durable Objects]
        
        CDN --> WORKER
        WORKER --> KV
        WORKER --> DO
    end
    
    subgraph "Client Applications"
        WEB[Web Dashboard]
        API[API Clients]
        MOBILE[Mobile App]
        
        WEB <--> CDN
        API <--> WORKER
        MOBILE <--> WORKER
    end
    
    subgraph "AI Integration"
        MCP[MCP over SSE]
        LLM[LLM APIs]
        
        WORKER <--> MCP
        MCP <--> LLM
    end
    
    style WORKER fill:#fce4ec
    style KV fill:#e1f5fe
    style DO fill:#f3e5f5
    style MCP fill:#fff3e0
```

**Benefits:**
- Global scale
- High availability
- Managed infrastructure
- Auto-scaling

## Security Architecture

### Authentication & Authorization

```mermaid
graph LR
    CLIENT[Client] --> AUTH[Auth Layer]
    AUTH --> JWT[JWT Validation]
    AUTH --> APIKEY[API Key Check]
    AUTH --> RBAC[Role-Based Access]
    
    JWT --> ALLOW[Allow Request]
    APIKEY --> ALLOW
    RBAC --> ALLOW
    
    AUTH --> DENY[Deny Request]
    
    style AUTH fill:#ffebee
    style ALLOW fill:#e8f5e8
    style DENY fill:#ffcdd2
```

### Data Protection

```mermaid
graph TB
    subgraph "Data Protection Layers"
        INPUT[Input Validation]
        SANITIZE[Data Sanitization]
        ENCRYPT[Encryption at Rest]
        TLS[TLS in Transit]
        AUDIT[Audit Logging]
    end
    
    DATA[Raw Data] --> INPUT
    INPUT --> SANITIZE
    SANITIZE --> ENCRYPT
    ENCRYPT --> TLS
    TLS --> AUDIT
```

## Performance Architecture

### Caching Strategy

```mermaid
graph LR
    REQUEST[Request] --> L1[L1: Memory Cache]
    L1 --> L2[L2: Redis Cache]
    L2 --> L3[L3: Database]
    L3 --> ORIGIN[Origin Data]
    
    L1 -.-> RESPONSE[Response]
    L2 -.-> RESPONSE
    L3 -.-> RESPONSE
    ORIGIN -.-> RESPONSE
    
    style L1 fill:#e8f5e8
    style L2 fill:#fff3e0
    style L3 fill:#e3f2fd
```

### Load Balancing

```mermaid
graph TB
    LB[Load Balancer] --> S1[Server 1]
    LB --> S2[Server 2]
    LB --> S3[Server 3]
    
    S1 --> DB[(Shared Database)]
    S2 --> DB
    S3 --> DB
    
    style LB fill:#fce4ec
    style S1 fill:#e8f5e8
    style S2 fill:#e8f5e8
    style S3 fill:#e8f5e8
```

## Monitoring & Observability

### System Monitoring

```mermaid
graph TB
    APP[Application] --> METRICS[Metrics Collection]
    APP --> LOGS[Log Aggregation]
    APP --> TRACES[Distributed Tracing]
    
    METRICS --> PROMETHEUS[Prometheus]
    LOGS --> ELK[ELK Stack]
    TRACES --> JAEGER[Jaeger]
    
    PROMETHEUS --> GRAFANA[Grafana Dashboard]
    ELK --> KIBANA[Kibana Dashboard]
    JAEGER --> JAEGER_UI[Jaeger UI]
    
    style PROMETHEUS fill:#fff3e0
    style ELK fill:#e3f2fd
    style JAEGER fill:#e8f5e8
```

## Technology Stack

### Core Technologies

| Layer | Technology | Purpose | Alternatives |
|-------|------------|---------|--------------|
| **Browser** | Chrome Extensions API | Browser integration | Firefox WebExtensions |
| **Runtime** | Node.js 18+ | Server runtime | Deno, Bun |
| **Protocol** | WebSocket | Real-time communication | Server-Sent Events |
| **Web Server** | Express.js | HTTP server framework | Fastify, Hapi |
| **AI Integration** | MCP SDK | AI assistant protocol | Custom protocols |
| **Cloud** | Cloudflare Workers | Edge computing | AWS Lambda, Vercel |
| **Storage** | KV + Durable Objects | Distributed storage | Redis, PostgreSQL |

### Development Tools

| Category | Tool | Purpose |
|----------|------|---------|
| **Language** | TypeScript | Type safety and developer experience |
| **Build** | esbuild | Fast bundling and compilation |
| **Testing** | Jest + Playwright | Unit and integration testing |
| **Linting** | ESLint + Prettier | Code quality and formatting |
| **Documentation** | MkDocs Material | Documentation generation |

## Architectural Decisions

### Why Chrome Extensions?
- **Native Integration** - Direct access to DevTools API
- **Security Model** - Sandboxed execution environment
- **Cross-Platform** - Works on all desktop platforms
- **Established Ecosystem** - Well-documented APIs and tooling

### Why MCP Protocol?
- **Standardization** - Industry-standard protocol for AI integration
- **Flexibility** - Works with multiple AI assistants
- **Future-Proof** - Evolving standard with broad adoption
- **Tool Discovery** - Self-describing capabilities

### Why Cloudflare Workers?
- **Global Edge Network** - Low latency worldwide
- **Serverless Architecture** - Automatic scaling and cost efficiency
- **Modern Runtime** - V8 isolates with fast cold starts
- **Integrated Services** - KV storage, Durable Objects, R2

## Scalability Considerations

### Horizontal Scaling
- Stateless server design
- Session affinity via Durable Objects
- Database read replicas
- CDN for static assets

### Vertical Scaling
- Memory optimization
- Connection pooling
- Efficient data structures
- CPU-intensive task offloading

### Auto-Scaling Triggers
- Request volume
- Response time thresholds
- Error rate limits
- Resource utilization

## Future Architecture Evolution

### Planned Enhancements
1. **Multi-Browser Support** - Firefox, Safari integration
2. **Plugin System** - Custom tool development
3. **Distributed Caching** - Redis cluster integration
4. **Real-time Collaboration** - Multiple users on same session
5. **Advanced Analytics** - Machine learning insights

### Migration Paths
- **Kubernetes Deployment** - Container orchestration
- **Microservices Architecture** - Service decomposition
- **Event-Driven Architecture** - Message queue integration
- **GraphQL API** - Unified data access layer

## Next Steps

- **[Component Details](components.md)** - Deep dive into each component
- **[Data Flow](data-flow.md)** - Detailed interaction patterns
- **[System Overview](overview.md)** - Technical implementation details

---

This architecture enables RapidTriageME to provide fast, reliable, and scalable AI-powered browser debugging across multiple platforms and deployment scenarios.