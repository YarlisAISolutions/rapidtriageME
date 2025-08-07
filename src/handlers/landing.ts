/**
 * Landing Page Handler for RapidTriageME
 * Provides documentation and setup instructions
 */

export function generateLandingPage(env: any): string {
  const baseUrl = env.ENVIRONMENT === 'production' 
    ? 'https://rapidtriage.me' 
    : 'https://rapidtriage-me.sireesh-yarlagadda-d3f.workers.dev';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RapidTriageME - Browser Automation MCP Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: rgba(255, 255, 255, 0.98);
      border-radius: 20px;
      padding: 50px;
      max-width: 900px;
      width: 100%;
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
      margin-bottom: 35px;
      font-size: 1.2em;
      font-weight: 400;
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
    }
    .endpoint:hover {
      background: #4a5568;
      transform: translateX(5px);
    }
    .endpoint-label {
      color: #a0aec0;
      font-size: 0.9em;
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
    }
    .section {
      margin: 35px 0;
    }
    .section h2 {
      color: #2d3748;
      margin-bottom: 18px;
      font-size: 1.6em;
      font-weight: 600;
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
    .footer {
      margin-top: 50px;
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
    @media (max-width: 640px) {
      .container {
        padding: 30px 20px;
      }
      h1 {
        font-size: 2em;
      }
      code {
        font-size: 0.85em;
        padding: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 RapidTriageME</h1>
    <p class="subtitle">Advanced Browser Automation & Debugging Platform by YarlisAISolutions</p>
    
    <div class="status">
      <div class="status-title">Service Status <span class="success-badge">OPERATIONAL</span></div>
      <div style="color: #48bb78; margin-top: 10px;">
        ✅ All systems are operational | Environment: <strong>${env.ENVIRONMENT || 'production'}</strong>
      </div>
    </div>

    <div class="section">
      <h2>📍 API Endpoints</h2>
      <div class="endpoint">
        <span>${baseUrl}/health</span>
        <span class="endpoint-label">Health Check</span>
      </div>
      <div class="endpoint">
        <span>${baseUrl}/sse</span>
        <span class="endpoint-label">SSE Connection (MCP)</span>
      </div>
      <div class="endpoint">
        <span>${baseUrl}/metrics</span>
        <span class="endpoint-label">Service Metrics</span>
      </div>
    </div>

    <div class="section">
      <h2>🔧 MCP Client Configuration</h2>
      <p style="margin-bottom: 15px; color: #718096;">
        Configure your MCP client with the following settings:
      </p>
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

    <div class="section">
      <h2>🛠️ Available Tools</h2>
      <div style="margin-top: 15px;">
        <span class="badge">remote_browser_navigate</span>
        <span class="badge">remote_capture_screenshot</span>
        <span class="badge">remote_execute_javascript</span>
        <span class="badge">remote_get_console_logs</span>
        <span class="badge">remote_get_network_logs</span>
        <span class="badge">remote_inspect_element</span>
        <span class="badge">remote_run_lighthouse_audit</span>
        <span class="badge">remote_generate_triage_report</span>
      </div>
    </div>

    <div class="section">
      <h2>🚀 Quick Start</h2>
      <ol style="line-height: 2; color: #4a5568; padding-left: 20px;">
        <li>Obtain your authentication token from the administrator</li>
        <li>Configure your MCP client with the settings above</li>
        <li>Connect to the SSE endpoint to establish communication</li>
        <li>Start using browser automation tools through MCP protocol</li>
      </ol>
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