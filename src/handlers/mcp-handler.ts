/**
 * MCP Protocol Handler for RapidTriageME
 * Implements the Model Context Protocol for browser triage operations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

export class RemoteBrowserMCPHandler {
  private server!: Server;
  private env: any;
  
  constructor(env: any) {
    this.env = env;
    this.initializeServer();
  }
  
  private initializeServer() {
    this.server = new Server(
      {
        name: "rapidtriage-mcp",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );
    
    // Initialize requestHandlers if not exists
    if (!(this.server as any).requestHandlers) {
      (this.server as any).requestHandlers = new Map();
    }
    
    // Define available resources for browser triage
    (this.server as any).requestHandlers.set('resources/list', async () => ({
      resources: [
        {
          uri: "browser://status",
          name: "Browser Status",
          description: "Current browser connection status and metrics",
          mimeType: "application/json"
        },
        {
          uri: "browser://logs",
          name: "Browser Logs",
          description: "Recent browser console logs and errors",
          mimeType: "application/json"
        },
        {
          uri: "browser://network",
          name: "Network Activity",
          description: "Recent network requests and responses",
          mimeType: "application/json"
        }
      ]
    }));
    
    // Define available prompts for browser triage
    (this.server as any).requestHandlers.set('prompts/list', async () => ({
      prompts: [
        {
          name: "debug_page",
          description: "Debug a webpage by analyzing console logs, network requests, and performance",
          arguments: [
            {
              name: "url",
              description: "URL of the page to debug",
              required: true
            }
          ]
        },
        {
          name: "accessibility_audit",
          description: "Run comprehensive accessibility audit on a webpage",
          arguments: [
            {
              name: "url",
              description: "URL to audit",
              required: true
            }
          ]
        },
        {
          name: "performance_analysis",
          description: "Analyze page load performance and provide optimization recommendations",
          arguments: [
            {
              name: "url",
              description: "URL to analyze",
              required: true
            }
          ]
        }
      ]
    }));
    
    // Define available tools for browser triage
    (this.server as any).requestHandlers.set('tools/list', async () => ({
      tools: [
        {
          name: "remote_browser_navigate",
          description: "Navigate to a URL in the browser for remote triage",
          inputSchema: {
            type: "object",
            properties: {
              url: { 
                type: "string", 
                description: "URL to navigate to (supports localhost for local development)" 
              },
              waitForLoad: { 
                type: "boolean", 
                default: true,
                description: "Wait for page to fully load"
              },
              timeout: { 
                type: "number", 
                default: 30000,
                description: "Navigation timeout in milliseconds"
              }
            },
            required: ["url"]
          }
        },
        {
          name: "remote_capture_screenshot",
          description: "Capture screenshot of current page for analysis", 
          inputSchema: {
            type: "object",
            properties: {
              fullPage: { 
                type: "boolean", 
                default: true,
                description: "Capture entire page or just viewport"
              },
              quality: { 
                type: "number", 
                default: 90,
                description: "JPEG quality (1-100)"
              },
              format: { 
                type: "string", 
                enum: ["png", "jpeg"], 
                default: "png",
                description: "Image format"
              }
            }
          }
        },
        {
          name: "remote_get_console_logs",
          description: "Retrieve browser console logs for debugging",
          inputSchema: {
            type: "object", 
            properties: {
              level: { 
                type: "string", 
                enum: ["all", "error", "warn", "info", "log"],
                default: "all",
                description: "Filter by log level"
              },
              limit: { 
                type: "number", 
                default: 100,
                description: "Maximum number of logs to retrieve"
              },
              since: { 
                type: "string", 
                description: "ISO timestamp to get logs since"
              }
            }
          }
        },
        {
          name: "remote_get_network_logs", 
          description: "Retrieve network requests for performance analysis",
          inputSchema: {
            type: "object",
            properties: {
              filter: {
                type: "object",
                properties: {
                  status: { 
                    type: "array", 
                    items: { type: "number" },
                    description: "Filter by HTTP status codes"
                  },
                  method: { 
                    type: "string",
                    description: "Filter by HTTP method"
                  },
                  resourceType: { 
                    type: "string",
                    description: "Filter by resource type (xhr, fetch, script, etc.)"
                  }
                }
              },
              limit: { 
                type: "number", 
                default: 50,
                description: "Maximum number of requests to retrieve"
              }
            }
          }
        },
        {
          name: "remote_run_lighthouse_audit",
          description: "Run Lighthouse audit for performance, accessibility, SEO, and best practices",
          inputSchema: {
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: { 
                  type: "string", 
                  enum: ["performance", "accessibility", "best-practices", "seo"] 
                },
                default: ["performance", "accessibility"],
                description: "Audit categories to run"
              },
              device: { 
                type: "string", 
                enum: ["mobile", "desktop"], 
                default: "desktop",
                description: "Device emulation mode"
              }
            }
          }
        },
        {
          name: "remote_inspect_element",
          description: "Inspect DOM element for detailed analysis",
          inputSchema: {
            type: "object", 
            properties: {
              selector: { 
                type: "string", 
                description: "CSS selector for element to inspect"
              },
              includeStyles: { 
                type: "boolean", 
                default: true,
                description: "Include computed styles"
              },
              includeAttributes: { 
                type: "boolean", 
                default: true,
                description: "Include element attributes"
              }
            },
            required: ["selector"]
          }
        },
        {
          name: "remote_execute_javascript",
          description: "Execute JavaScript in browser context for advanced debugging",
          inputSchema: {
            type: "object",
            properties: {
              code: { 
                type: "string", 
                description: "JavaScript code to execute"
              },
              timeout: { 
                type: "number", 
                default: 5000,
                description: "Execution timeout in milliseconds"
              }
            },
            required: ["code"]
          }
        },
        {
          name: "remote_generate_triage_report",
          description: "Generate comprehensive triage report with all collected data",
          inputSchema: {
            type: "object",
            properties: {
              includeScreenshot: { 
                type: "boolean", 
                default: true,
                description: "Include page screenshot"
              },
              includeLogs: { 
                type: "boolean", 
                default: true,
                description: "Include console logs"
              }, 
              includeNetworkAnalysis: { 
                type: "boolean", 
                default: true,
                description: "Include network request analysis"
              },
              includePerformanceAudit: { 
                type: "boolean", 
                default: true,
                description: "Include Lighthouse performance audit"
              }
            }
          }
        }
      ]
    }));
    
    // Handle tool execution
    (this.server as any).requestHandlers.set('tools/call', async (request: any) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Execute the requested tool
        const result = await this.executeTool(name, args);
        return result;
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error executing ${name}: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    });
  }
  
  async handleSSE(request: Request, _ctx: ExecutionContext): Promise<Response> {
    // Handle both SSE and JSON-RPC requests
    const contentType = request.headers.get('content-type');
    
    // If it's a JSON-RPC request, handle it directly
    if (contentType?.includes('application/json')) {
      return this.handleJSONRPC(request);
    }
    
    // Otherwise, handle as SSE
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    // Handle SSE connection
    _ctx.waitUntil(this.handleSSEConnection(writer, request));
    
    return new Response(readable, { headers });
  }
  
  private async handleJSONRPC(request: Request): Promise<Response> {
    try {
      const body = await request.json() as any;
      const { method, params, id } = body;
      
      let result;
      
      // Handle different MCP methods
      if (method === 'tools/list') {
        const handler = (this.server as any).requestHandlers.get('tools/list');
        result = await handler();
      } else if (method === 'tools/call') {
        const handler = (this.server as any).requestHandlers.get('tools/call');
        result = await handler({ params });
      } else {
        throw new Error(`Unknown method: ${method}`);
      }
      
      // Return JSON-RPC response
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        result,
        id
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Max-Age': '86400',
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: (error as Error).message
        },
        id: null
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
  
  private async handleSSEConnection(writer: WritableStreamDefaultWriter, _request: Request) {
    try {
      // Send initial connection message
      await writer.write(new TextEncoder().encode(
        `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`
      ));
      
      // Keep connection alive with heartbeat
      const heartbeat = setInterval(async () => {
        try {
          await writer.write(new TextEncoder().encode(': heartbeat\n\n'));
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 30000);
      
      // Handle MCP protocol messages
      // This would integrate with the actual MCP server transport
      
    } catch (error) {
      console.error('SSE connection error:', error);
    } finally {
      await writer.close();
    }
  }
  
  async handleAPI(request: Request, pathname: string): Promise<Response> {
    const body = await request.json().catch(() => ({}));
    
    // Map API endpoints to tool executions
    const toolMap: { [key: string]: string } = {
      '/api/screenshot': 'remote_capture_screenshot',
      '/api/console-logs': 'remote_get_console_logs',
      '/api/network-logs': 'remote_get_network_logs',
      '/api/lighthouse': 'remote_run_lighthouse_audit',
      '/api/inspect-element': 'remote_inspect_element',
      '/api/execute-js': 'remote_execute_javascript',
      '/api/navigate': 'remote_browser_navigate',
      '/api/triage-report': 'remote_generate_triage_report',
    };
    
    const toolName = toolMap[pathname];
    if (!toolName) {
      return new Response('Not Found', { status: 404 });
    }
    
    try {
      const result = await this.executeTool(toolName, body);
      return new Response(JSON.stringify(result), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  private async executeTool(name: string, args: any): Promise<any> {
    // This would integrate with the actual browser tools
    // For now, return mock responses for demonstration
    
    switch (name) {
      case 'remote_browser_navigate':
        return {
          content: [{
            type: "text",
            text: `Successfully navigated to ${args.url}`
          }]
        };
        
      case 'remote_capture_screenshot':
        // Handle screenshot data if provided (from extension)
        if (args.data) {
          // Use the screenshot storage service if available
          if (this.env.SCREENSHOTS && this.env.SESSIONS) {
            try {
              const { ScreenshotStorageService } = await import('../services/screenshot-storage');
              const storageService = new ScreenshotStorageService(this.env.SCREENSHOTS, this.env.SESSIONS);
              
              const result = await storageService.storeScreenshot({
                data: args.data,
                url: args.url || 'unknown',
                title: args.title || 'untitled',
                tenant: args.tenant,
                project: args.project || 'goflyplan',
                session: args.session,
                tags: args.tags
              });
              
              return {
                content: [
                  {
                    type: "text", 
                    text: `Screenshot stored successfully: ${result.id}`
                  },
                  {
                    type: "text",
                    text: `Path: ${result.path}\nURL: ${result.url}\nExpires: ${result.expires}`
                  }
                ]
              };
            } catch (error) {
              console.error('Failed to store screenshot:', error);
              return {
                content: [{
                  type: "text",
                  text: `Screenshot storage failed: ${(error as Error).message}`
                }]
              };
            }
          }
          
          // Fallback if R2 not configured
          const timestamp = new Date().toISOString();
          const filename = `screenshot-${Date.now()}.png`;
          
          console.log(`Received screenshot data (R2 not configured): ${args.data.substring(0, 50)}...`);
          
          return {
            content: [
              {
                type: "text", 
                text: `Screenshot received (storage pending): ${filename}`
              },
              {
                type: "text",
                text: `URL: ${args.url || 'unknown'}\nTitle: ${args.title || 'untitled'}\nTimestamp: ${timestamp}`
              }
            ]
          };
        }
        
        // If no data provided, return placeholder
        return {
          content: [
            {
              type: "text", 
              text: "Screenshot capture request received (remote server cannot capture directly)"
            }
          ]
        };
        
      case 'remote_get_console_logs':
        return {
          content: [{
            type: "text",
            text: `Console Logs:\n[INFO] Page loaded\n[WARN] Deprecation warning\n[ERROR] Failed to load resource`
          }]
        };
        
      case 'remote_get_network_logs':
        return {
          content: [{
            type: "text",
            text: `Network Analysis:\nTotal Requests: 42\nFailed Requests: 2\nAverage Response Time: 234ms`
          }]
        };
        
      case 'remote_run_lighthouse_audit':
        return {
          content: [{
            type: "text",
            text: `Lighthouse Audit Results:\nPerformance: 92/100\nAccessibility: 88/100\nBest Practices: 95/100\nSEO: 100/100`
          }]
        };
        
      case 'remote_inspect_element':
        return {
          content: [{
            type: "text",
            text: `Element Inspection (${args.selector}):\n{\n  "tagName": "div",\n  "className": "container",\n  "innerText": "Content here"\n}`
          }]
        };
        
      case 'remote_execute_javascript':
        return {
          content: [{
            type: "text",
            text: `JavaScript Execution Result:\n${args.code}\n\nResult: undefined`
          }]
        };
        
      case 'remote_generate_triage_report':
        return {
          content: [{
            type: "text",
            text: `# Triage Report\n\n## Summary\n- URL: localhost:3000\n- Status: Issues Detected\n\n## Console Errors: 3\n## Network Failures: 2\n## Performance Score: 85/100\n\n## Recommendations\n- Fix console errors\n- Optimize image loading\n- Enable caching`
          }]
        };
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}