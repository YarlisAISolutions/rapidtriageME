/**
 * Landing Page Handler for RapidTriageME
 * Provides documentation and setup instructions
 */

export function generateLandingPage(env: any): string {
  const baseUrl = env.ENVIRONMENT === 'production' 
    ? 'https://rapidtriage.me' 
    : 'https://rapidtriage-me.sireesh-yarlagadda-d3f.workers.dev';
  
  // Get deployment timestamp from environment or use current time
  const deploymentTime = env.DEPLOYMENT_TIMESTAMP || new Date().toISOString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RapidTriageME - Browser Automation & Debugging Platform</title>
  <meta name="description" content="Enterprise-grade browser automation and debugging platform with MCP protocol support. Capture screenshots, analyze performance, run audits, and debug web applications remotely.">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      background: rgba(255, 255, 255, 0.98);
      border-radius: 20px;
      padding: 50px;
      max-width: 1200px;
      margin: 0 auto;
      box-shadow: 0 25px 70px rgba(0,0,0,0.2);
    }
    h1 {
      color: #2d3748;
      margin-bottom: 12px;
      font-size: 2.8em;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: #718096;
      margin-bottom: 20px;
      font-size: 1.2em;
      font-weight: 400;
    }
    .hero-description {
      color: #4a5568;
      font-size: 1.05em;
      line-height: 1.6;
      margin-bottom: 35px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 10px;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .feature-card {
      background: #f7fafc;
      padding: 20px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .feature-card h3 {
      color: #2d3748;
      margin-bottom: 10px;
      font-size: 1.1em;
    }
    .feature-card p {
      color: #718096;
      font-size: 0.95em;
      line-height: 1.5;
    }
    .status {
      background: #f7fafc;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
    }
    .status-title {
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 10px;
      font-size: 1.1em;
    }
    .endpoint {
      background: #2d3748;
      color: #f7fafc;
      padding: 12px 18px;
      border-radius: 8px;
      margin: 8px 0;
      font-family: 'Courier New', monospace;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    }
    .endpoint:hover {
      background: #4a5568;
      transform: translateX(5px);
    }
    .endpoint-label {
      color: #a0aec0;
      font-size: 0.9em;
    }
    .copy-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: #667eea;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .endpoint:hover .copy-btn {
      opacity: 1;
    }
    .copy-btn:hover {
      background: #764ba2;
    }
    code {
      background: #edf2f7;
      padding: 20px;
      border-radius: 10px;
      display: block;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      margin: 20px 0;
      border: 1px solid #e2e8f0;
      font-size: 0.95em;
      line-height: 1.6;
      position: relative;
    }
    .code-wrapper {
      position: relative;
    }
    .code-copy-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #667eea;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.85em;
      cursor: pointer;
      z-index: 10;
    }
    .code-copy-btn:hover {
      background: #764ba2;
    }
    .section {
      margin: 40px 0;
    }
    .section h2 {
      color: #2d3748;
      margin-bottom: 20px;
      font-size: 1.8em;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section h3 {
      color: #4a5568;
      margin: 20px 0 15px 0;
      font-size: 1.3em;
      font-weight: 600;
    }
    .tools-grid {
      display: grid;
      gap: 25px;
      margin-top: 20px;
    }
    .tool-category {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }
    .tool-category h4 {
      color: #2d3748;
      margin-bottom: 15px;
      font-size: 1.2em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tool-item {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .tool-item h5 {
      color: #667eea;
      margin-bottom: 8px;
      font-family: 'Courier New', monospace;
      font-size: 1em;
    }
    .tool-item p {
      color: #718096;
      font-size: 0.95em;
      line-height: 1.5;
      margin-bottom: 10px;
    }
    .tool-example {
      background: #2d3748;
      color: #f7fafc;
      padding: 10px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
      overflow-x: auto;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
      margin-right: 10px;
      margin-top: 8px;
    }
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
    }
    .tab {
      padding: 10px 20px;
      background: none;
      border: none;
      color: #718096;
      font-size: 1em;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
    }
    .tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }
    .tab:hover {
      color: #4a5568;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    .alert {
      padding: 15px 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .alert-info {
      background: #ebf8ff;
      border-left: 4px solid #3182ce;
      color: #2c5282;
    }
    .alert-warning {
      background: #fefcbf;
      border-left: 4px solid #d69e2e;
      color: #744210;
    }
    .alert-success {
      background: #f0fff4;
      border-left: 4px solid #48bb78;
      color: #22543d;
    }
    ol {
      padding-left: 20px;
      line-height: 2;
      color: #4a5568;
    }
    ol li {
      margin: 10px 0;
    }
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #718096;
      font-size: 0.95em;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }
    .footer a:hover {
      color: #764ba2;
    }
    .success-badge {
      background: #48bb78;
      color: white;
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 0.8em;
      margin-left: 10px;
      font-weight: 600;
    }
    .metric {
      display: inline-block;
      margin: 0 15px;
      padding: 8px 16px;
      background: #f7fafc;
      border-radius: 8px;
    }
    .metric-label {
      color: #718096;
      font-size: 0.85em;
    }
    .metric-value {
      color: #2d3748;
      font-weight: 600;
      font-size: 1.1em;
    }
    @media (max-width: 640px) {
      .container {
        padding: 30px 20px;
      }
      h1 {
        font-size: 2em;
      }
      .features-grid {
        grid-template-columns: 1fr;
      }
      code {
        font-size: 0.85em;
        padding: 15px;
      }
      .tabs {
        flex-wrap: wrap;
      }
    }
  </style>
  <script>
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      });
    }
    
    function switchTab(tabName) {
      const tabs = document.querySelectorAll('.tab');
      const contents = document.querySelectorAll('.tab-content');
      
      tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
          tab.classList.add('active');
        }
      });
      
      contents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabName) {
          content.classList.add('active');
        }
      });
    }
  </script>
</head>
<body>
  <div class="container">
    <h1>🚀 RapidTriageME</h1>
    <p class="subtitle">Enterprise Browser Automation & Debugging Platform by YarlisAISolutions</p>
    
    <div class="hero-description">
      <strong>RapidTriageME</strong> is a powerful browser automation and debugging platform that enables developers and QA engineers to remotely control browsers, capture screenshots, analyze performance metrics, and debug web applications through the Model Context Protocol (MCP). Perfect for automated testing, monitoring, and troubleshooting web applications at scale.
    </div>
    
    <div class="features-grid">
      <div class="feature-card">
        <h3>🎯 Remote Browser Control</h3>
        <p>Navigate pages, execute JavaScript, and interact with elements remotely through a secure API.</p>
      </div>
      <div class="feature-card">
        <h3>📸 Screenshot Capture</h3>
        <p>Capture full-page or viewport screenshots with automatic storage and retrieval capabilities.</p>
      </div>
      <div class="feature-card">
        <h3>🔍 Debug & Analyze</h3>
        <p>Access console logs, network requests, and element inspection tools for comprehensive debugging.</p>
      </div>
      <div class="feature-card">
        <h3>📊 Performance Audits</h3>
        <p>Run Lighthouse audits for performance, accessibility, SEO, and best practices analysis.</p>
      </div>
      <div class="feature-card">
        <h3>🔌 MCP Protocol</h3>
        <p>Industry-standard Model Context Protocol for seamless integration with AI assistants.</p>
      </div>
      <div class="feature-card">
        <h3>🛡️ Enterprise Security</h3>
        <p>Token-based authentication, rate limiting, and secure WebSocket connections.</p>
      </div>
    </div>
    
    <div class="status">
      <div class="status-title">Service Status <span class="success-badge">OPERATIONAL</span></div>
      <div style="color: #48bb78; margin-top: 10px;">
        ✅ All systems running | Environment: <strong>${env.ENVIRONMENT || 'production'}</strong>
      </div>
      <div style="margin-top: 15px;">
        <span class="metric">
          <span class="metric-label">Uptime</span>
          <span class="metric-value">99.9%</span>
        </span>
        <span class="metric">
          <span class="metric-label">Response Time</span>
          <span class="metric-value">&lt;200ms</span>
        </span>
        <span class="metric">
          <span class="metric-label">Rate Limit</span>
          <span class="metric-value">100 req/min</span>
        </span>
      </div>
    </div>

    <div class="section">
      <h2>📍 API Endpoints</h2>
      <div class="endpoint" onclick="copyToClipboard('${baseUrl}/health')">
        <span>${baseUrl}/health</span>
        <span class="endpoint-label">Health Check</span>
        <button class="copy-btn">Copy</button>
      </div>
      <div class="endpoint" onclick="copyToClipboard('${baseUrl}/sse')">
        <span>${baseUrl}/sse</span>
        <span class="endpoint-label">SSE Connection (MCP)</span>
        <button class="copy-btn">Copy</button>
      </div>
      <div class="endpoint" onclick="copyToClipboard('${baseUrl}/mcp')">
        <span>${baseUrl}/mcp</span>
        <span class="endpoint-label">MCP HTTP Endpoint</span>
        <button class="copy-btn">Copy</button>
      </div>
      <div class="endpoint" onclick="copyToClipboard('${baseUrl}/metrics')">
        <span>${baseUrl}/metrics</span>
        <span class="endpoint-label">Service Metrics</span>
        <button class="copy-btn">Copy</button>
      </div>
      <div class="endpoint" onclick="copyToClipboard('${baseUrl}/screenshot')">
        <span>${baseUrl}/screenshot/*</span>
        <span class="endpoint-label">Screenshot Storage</span>
        <button class="copy-btn">Copy</button>
      </div>
    </div>

    <div class="section">
      <h2>🛠️ Available Tools & Commands</h2>
      
      <div class="tools-grid">
        <div class="tool-category">
          <h4>🌐 Navigation & Control</h4>
          <div class="tool-item">
            <h5>remote_browser_navigate</h5>
            <p>Navigate to any URL and wait for page load completion</p>
            <div class="tool-example">
              {"url": "https://example.com", "waitUntil": "networkidle"}
            </div>
          </div>
          <div class="tool-item">
            <h5>remote_execute_javascript</h5>
            <p>Execute JavaScript code in the browser context</p>
            <div class="tool-example">
              {"script": "document.querySelector('button').click()"}
            </div>
          </div>
        </div>
        
        <div class="tool-category">
          <h4>📸 Capture & Visual</h4>
          <div class="tool-item">
            <h5>remote_capture_screenshot</h5>
            <p>Capture screenshots with various options for full page or viewport</p>
            <div class="tool-example">
              {"url": "https://example.com", "fullPage": true, "format": "png"}
            </div>
          </div>
          <div class="tool-item">
            <h5>remote_inspect_element</h5>
            <p>Inspect DOM elements and get computed styles</p>
            <div class="tool-example">
              {"selector": "#main-content", "includeStyles": true}
            </div>
          </div>
        </div>
        
        <div class="tool-category">
          <h4>🔍 Debugging & Analysis</h4>
          <div class="tool-item">
            <h5>remote_get_console_logs</h5>
            <p>Retrieve browser console logs, errors, and warnings</p>
            <div class="tool-example">
              {"level": "all", "limit": 100}
            </div>
          </div>
          <div class="tool-item">
            <h5>remote_get_network_logs</h5>
            <p>Get detailed network request and response information</p>
            <div class="tool-example">
              {"filter": "xhr", "includeHeaders": true}
            </div>
          </div>
        </div>
        
        <div class="tool-category">
          <h4>📊 Audits & Reports</h4>
          <div class="tool-item">
            <h5>remote_run_lighthouse_audit</h5>
            <p>Run comprehensive Lighthouse audits for performance, accessibility, SEO</p>
            <div class="tool-example">
              {"url": "https://example.com", "categories": ["performance", "accessibility"]}
            </div>
          </div>
          <div class="tool-item">
            <h5>remote_generate_triage_report</h5>
            <p>Generate detailed debugging reports with all collected data</p>
            <div class="tool-example">
              {"includeScreenshot": true, "includeLogs": true, "format": "json"}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🔧 Configuration & Setup</h2>
      
      <div class="tabs">
        <button class="tab active" data-tab="mcp-config" onclick="switchTab('mcp-config')">MCP Client</button>
        <button class="tab" data-tab="curl-examples" onclick="switchTab('curl-examples')">cURL Examples</button>
        <button class="tab" data-tab="js-integration" onclick="switchTab('js-integration')">JavaScript</button>
        <button class="tab" data-tab="auth-setup" onclick="switchTab('auth-setup')">Authentication</button>
      </div>
      
      <div id="mcp-config" class="tab-content active">
        <p style="margin-bottom: 15px; color: #718096;">
          Configure your MCP client (Claude, Cline, etc.) with these settings:
        </p>
        <div class="code-wrapper">
          <button class="code-copy-btn" onclick="copyToClipboard(JSON.stringify({
            mcpServers: {
              rapidtriage: {
                type: 'sse',
                url: '${baseUrl}/sse',
                headers: {
                  Authorization: 'Bearer YOUR_AUTH_TOKEN'
                },
                capabilities: {
                  tools: true,
                  resources: true,
                  prompts: true
                }
              }
            }
          }, null, 2))">Copy</button>
          <code>{
  "mcpServers": {
    "rapidtriage": {
      "type": "sse",
      "url": "${baseUrl}/sse",
      "headers": {
        "Authorization": "Bearer YOUR_AUTH_TOKEN"
      },
      "capabilities": {
        "tools": true,
        "resources": true,
        "prompts": true
      }
    }
  }
}</code>
        </div>
      </div>
      
      <div id="curl-examples" class="tab-content">
        <h3>Health Check</h3>
        <div class="code-wrapper">
          <button class="code-copy-btn" onclick="copyToClipboard('curl ${baseUrl}/health')">Copy</button>
          <code>curl ${baseUrl}/health</code>
        </div>
        
        <h3>Take Screenshot</h3>
        <div class="code-wrapper">
          <button class="code-copy-btn" onclick="copyToClipboard(\`curl -X POST ${baseUrl}/mcp \\\\
  -H "Content-Type: application/json" \\\\
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \\\\
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"remote_capture_screenshot","arguments":{"url":"https://example.com"}},"id":1}'\`)">Copy</button>
          <code>curl -X POST ${baseUrl}/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \\
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"remote_capture_screenshot","arguments":{"url":"https://example.com"}},"id":1}'</code>
        </div>
        
        <h3>Get Console Logs</h3>
        <div class="code-wrapper">
          <button class="code-copy-btn" onclick="copyToClipboard(\`curl -X POST ${baseUrl}/mcp \\\\
  -H "Content-Type: application/json" \\\\
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \\\\
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"remote_get_console_logs","arguments":{}},"id":1}'\`)">Copy</button>
          <code>curl -X POST ${baseUrl}/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \\
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"remote_get_console_logs","arguments":{}},"id":1}'</code>
        </div>
      </div>
      
      <div id="js-integration" class="tab-content">
        <h3>JavaScript/TypeScript Integration</h3>
        <div class="code-wrapper">
          <button class="code-copy-btn" onclick="copyToClipboard(\`// Install MCP SDK
// npm install @modelcontextprotocol/sdk

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSETransport } from '@modelcontextprotocol/sdk/transport/sse.js';

// Initialize client
const transport = new SSETransport('${baseUrl}/sse', {
  headers: {
    'Authorization': 'Bearer YOUR_AUTH_TOKEN'
  }
});

const client = new Client({
  name: 'my-app',
  version: '1.0.0'
}, {
  capabilities: {}
});

// Connect and use
await client.connect(transport);

// Take screenshot
const result = await client.callTool('remote_capture_screenshot', {
  url: 'https://example.com',
  fullPage: true
});

console.log('Screenshot URL:', result.screenshotUrl);\`)">Copy</button>
          <code>// Install MCP SDK
// npm install @modelcontextprotocol/sdk

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSETransport } from '@modelcontextprotocol/sdk/transport/sse.js';

// Initialize client
const transport = new SSETransport('${baseUrl}/sse', {
  headers: {
    'Authorization': 'Bearer YOUR_AUTH_TOKEN'
  }
});

const client = new Client({
  name: 'my-app',
  version: '1.0.0'
}, {
  capabilities: {}
});

// Connect and use
await client.connect(transport);

// Take screenshot
const result = await client.callTool('remote_capture_screenshot', {
  url: 'https://example.com',
  fullPage: true
});

console.log('Screenshot URL:', result.screenshotUrl);</code>
        </div>
      </div>
      
      <div id="auth-setup" class="tab-content">
        <div class="alert alert-info">
          <strong>🔐 Authentication Required</strong><br>
          All API endpoints require Bearer token authentication. Contact your administrator to obtain access tokens.
        </div>
        
        <h3>Token Management</h3>
        <ol>
          <li><strong>Request Access:</strong> Contact support@rapidtriage.me with your use case</li>
          <li><strong>Receive Token:</strong> You'll receive a secure API token via email</li>
          <li><strong>Configure Headers:</strong> Add to all requests: <code style="display: inline; padding: 2px 6px;">Authorization: Bearer YOUR_TOKEN</code></li>
          <li><strong>Token Rotation:</strong> Tokens expire after 90 days - request renewal before expiration</li>
        </ol>
        
        <h3>Security Best Practices</h3>
        <ul style="line-height: 1.8; color: #4a5568; padding-left: 20px;">
          <li>Never commit tokens to version control</li>
          <li>Use environment variables for token storage</li>
          <li>Rotate tokens regularly</li>
          <li>Monitor usage through the metrics endpoint</li>
          <li>Report suspicious activity immediately</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>🚀 Quick Start Guide</h2>
      <ol>
        <li>
          <strong>Get Authentication Token</strong><br>
          <span style="color: #718096;">Contact your administrator or request access at support@rapidtriage.me</span>
        </li>
        <li>
          <strong>Choose Integration Method</strong><br>
          <span style="color: #718096;">MCP Client (recommended), HTTP API, or JavaScript SDK</span>
        </li>
        <li>
          <strong>Configure Your Client</strong><br>
          <span style="color: #718096;">Use the configuration examples above for your chosen method</span>
        </li>
        <li>
          <strong>Test Connection</strong><br>
          <span style="color: #718096;">Start with the health check endpoint to verify connectivity</span>
        </li>
        <li>
          <strong>Begin Automation</strong><br>
          <span style="color: #718096;">Use the tools to automate browser tasks and debugging</span>
        </li>
      </ol>
      
      <div class="alert alert-warning" style="margin-top: 25px;">
        <strong>⚡ Rate Limits Apply</strong><br>
        Default: 100 requests per minute per token. Contact support for higher limits.
      </div>
    </div>
    
    <div class="section">
      <h2>📋 System Requirements</h2>
      <div class="features-grid">
        <div class="feature-card">
          <h3>Client Requirements</h3>
          <p>• MCP-compatible client (Claude, Cline)<br>
             • Node.js 18+ for SDK<br>
             • Modern browser for web access<br>
             • Stable internet connection</p>
        </div>
        <div class="feature-card">
          <h3>Supported Browsers</h3>
          <p>• Chrome/Chromium (latest)<br>
             • Firefox (latest)<br>
             • Safari 14+<br>
             • Edge (Chromium-based)</p>
        </div>
        <div class="feature-card">
          <h3>API Compatibility</h3>
          <p>• REST/HTTP API<br>
             • Server-Sent Events (SSE)<br>
             • WebSocket (coming soon)<br>
             • GraphQL (roadmap)</p>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>🎯 Use Cases</h2>
      <div class="features-grid">
        <div class="feature-card">
          <h3>Automated Testing</h3>
          <p>Run end-to-end tests, capture visual regressions, and validate user flows across browsers.</p>
        </div>
        <div class="feature-card">
          <h3>Performance Monitoring</h3>
          <p>Track Core Web Vitals, analyze load times, and identify performance bottlenecks.</p>
        </div>
        <div class="feature-card">
          <h3>Debugging Support</h3>
          <p>Remote debugging for production issues, console log analysis, and network inspection.</p>
        </div>
        <div class="feature-card">
          <h3>Accessibility Audits</h3>
          <p>Automated WCAG compliance checks, screen reader testing, and keyboard navigation validation.</p>
        </div>
        <div class="feature-card">
          <h3>SEO Analysis</h3>
          <p>Meta tag validation, structured data testing, and search engine optimization audits.</p>
        </div>
        <div class="feature-card">
          <h3>Documentation</h3>
          <p>Automated screenshot generation for documentation, visual guides, and tutorials.</p>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>📚 Resources & Support</h2>
      <div class="alert alert-success">
        <strong>📖 Documentation</strong><br>
        Full API documentation and guides available at <a href="https://docs.rapidtriage.me" style="color: #22543d; font-weight: 600;">docs.rapidtriage.me</a>
      </div>
      
      <h3>Getting Help</h3>
      <ul style="line-height: 2; color: #4a5568; padding-left: 20px;">
        <li><strong>Email Support:</strong> <a href="mailto:support@rapidtriage.me">support@rapidtriage.me</a></li>
        <li><strong>GitHub Issues:</strong> <a href="https://github.com/YarlisAISolutions/rapidtriage" target="_blank">github.com/YarlisAISolutions/rapidtriage</a></li>
        <li><strong>Status Page:</strong> <a href="${baseUrl}/status" target="_blank">${baseUrl}/status</a></li>
        <li><strong>API Reference:</strong> <a href="${baseUrl}/api-docs" target="_blank">${baseUrl}/api-docs</a></li>
      </ul>
      
      <h3>Browser Extension</h3>
      <p style="color: #718096; line-height: 1.6; margin-top: 15px;">
        Install the RapidTriageME browser extension for enhanced debugging capabilities:
      </p>
      <div style="margin-top: 15px;">
        <span class="badge">Chrome Web Store</span>
        <span class="badge">Firefox Add-ons</span>
        <span class="badge">Edge Add-ons</span>
      </div>
    </div>

    <div class="footer">
      <p>
        <strong>RapidTriageME v1.0.0</strong> | 
        Powered by <a href="https://workers.cloudflare.com" target="_blank">Cloudflare Workers</a>
      </p>
      <p style="margin-top: 10px;">
        © 2024 YarlisAISolutions. All rights reserved. | 
        <a href="mailto:support@rapidtriage.me">Contact Support</a>
      </p>
      <p style="margin-top: 15px; font-size: 0.85em; color: #a0aec0;">
        Last deployed: <strong>${new Date(deploymentTime).toLocaleString('en-US', { 
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })}</strong>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function handleLandingPage(env: any): Response {
  try {
    const html = generateLandingPage(env);
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block'
      }
    });
  } catch (error) {
    console.error('Error generating landing page:', error);
    return new Response('Error loading page', { status: 500 });
  }
}