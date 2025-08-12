/**
 * API Documentation Handler
 * Serves interactive API documentation using Swagger UI
 */

import { getOpenApiSpec } from '../openapi/spec';

export class ApiDocsHandler {
  private openApiSpec: any;
  private env: any;

  constructor(env: any) {
    this.env = env;
    // Load OpenAPI spec - in production this would be bundled
    this.openApiSpec = this.getOpenApiSpec();
  }

  /**
   * Get OpenAPI specification with environment-specific values
   */
  private getOpenApiSpec(): any {
    const baseUrl = this.env.ENVIRONMENT === 'production' 
      ? 'https://rapidtriage.me' 
      : 'https://rapidtriage-me.sireesh-yarlagadda-d3f.workers.dev';

    return getOpenApiSpec(baseUrl);
  }

  /**
   * Serve Swagger UI HTML page
   */
  async handleSwaggerUI(_request: Request): Promise<Response> {
    const baseUrl = this.env.ENVIRONMENT === 'production' 
      ? 'https://rapidtriage.me' 
      : 'https://rapidtriage-me.sireesh-yarlagadda-d3f.workers.dev';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RapidTriageME API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .topbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 15px 30px;
      color: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .topbar h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .topbar p {
      margin: 5px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .topbar-links {
      float: right;
      margin-top: -35px;
    }
    .topbar-links a {
      color: white;
      text-decoration: none;
      margin-left: 20px;
      padding: 8px 16px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      transition: background 0.3s;
    }
    .topbar-links a:hover {
      background: rgba(255,255,255,0.3);
    }
    #swagger-ui {
      margin-top: 0;
    }
    .swagger-ui .topbar {
      display: none;
    }
    .swagger-ui .info {
      margin: 30px 0;
    }
    .swagger-ui .scheme-container {
      background: #f7fafc;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .download-links {
      background: #f7fafc;
      padding: 20px;
      margin: 20px auto;
      max-width: 1460px;
      border-radius: 8px;
      text-align: center;
    }
    .download-links h3 {
      margin-top: 0;
      color: #2d3748;
    }
    .download-links a {
      display: inline-block;
      margin: 0 10px;
      padding: 10px 20px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.3s;
    }
    .download-links a:hover {
      background: #764ba2;
    }
    @media (max-width: 768px) {
      .topbar-links {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="topbar">
    <h1>🚀 RapidTriageME API Documentation</h1>
    <p>Interactive API Explorer & Reference</p>
    <div class="topbar-links">
      <a href="/">Home</a>
      <a href="/status">Status</a>
      <a href="https://github.com/YarlisAISolutions/rapidtriage" target="_blank">GitHub</a>
    </div>
  </div>
  
  <div class="download-links">
    <h3>Download OpenAPI Specification</h3>
    <a href="/openapi.json" download="rapidtriage-openapi.json">📄 JSON Format</a>
    <a href="/openapi.yaml" download="rapidtriage-openapi.yaml">📝 YAML Format</a>
    <a href="https://github.com/YarlisAISolutions/rapidtriage/blob/main/docs/api" target="_blank">📚 Full Docs</a>
  </div>
  
  <div id="swagger-ui"></div>
  
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "${baseUrl}/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        displayRequestDuration: true,
        requestSnippetsEnabled: true,
        requestSnippets: {
          generators: {
            curl_bash: {
              title: "cURL (bash)",
              syntax: "bash"
            },
            curl_powershell: {
              title: "cURL (PowerShell)",
              syntax: "powershell"
            },
            curl_cmd: {
              title: "cURL (CMD)",
              syntax: "bash"
            },
            node_fetch: {
              title: "Node.js (Fetch)",
              syntax: "javascript"
            },
            javascript_fetch: {
              title: "JavaScript (Fetch)",
              syntax: "javascript"
            },
            python_requests: {
              title: "Python (Requests)",
              syntax: "python"
            }
          },
          defaultExpanded: true,
          languages: ["curl_bash", "javascript_fetch", "python_requests", "node_fetch"]
        },
        onComplete: function() {
          // Add authorization header helper
          const authToken = localStorage.getItem('rapidtriage_auth_token');
          if (authToken) {
            ui.preauthorizeApiKey('bearerAuth', authToken);
          }
        }
      });
      
      window.ui = ui;
      
      // Add token management
      document.addEventListener('authorize', function(e) {
        if (e.detail && e.detail.bearerAuth) {
          localStorage.setItem('rapidtriage_auth_token', e.detail.bearerAuth);
        }
      });
    };
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  /**
   * Serve ReDoc HTML page as alternative documentation
   */
  async handleReDoc(_request: Request): Promise<Response> {
    const baseUrl = this.env.ENVIRONMENT === 'production' 
      ? 'https://rapidtriage.me' 
      : 'https://rapidtriage-me.sireesh-yarlagadda-d3f.workers.dev';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RapidTriageME API Reference - ReDoc</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px 30px;
      color: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0 0 0;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 RapidTriageME API Reference</h1>
    <p>Complete API documentation with examples and schemas</p>
  </div>
  
  <div id="redoc-container"></div>
  
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    Redoc.init('${baseUrl}/openapi.json', {
      scrollYOffset: 0,
      theme: {
        colors: {
          primary: {
            main: '#667eea'
          },
          success: {
            main: '#48bb78'
          }
        },
        typography: {
          fontSize: '15px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          headings: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          },
          code: {
            fontFamily: '"SF Mono", Monaco, Consolas, "Courier New", monospace'
          }
        },
        sidebar: {
          backgroundColor: '#f7fafc',
          textColor: '#2d3748'
        }
      },
      expandResponses: '200,201',
      jsonSampleExpandLevel: 2,
      hideSingleRequestSampleTab: false,
      hideDownloadButton: false,
      disableSearch: false,
      onlyRequiredInSamples: false,
      showExtensions: true,
      hideSchemaPattern: false,
      noAutoAuth: false,
      pathInMiddlePanel: true,
      hideLoading: false,
      nativeScrollbars: false,
      showObjectSchemaExamples: true,
      requiredPropsFirst: true,
      sortPropsAlphabetically: false
    }, document.getElementById('redoc-container'));
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  /**
   * Serve OpenAPI spec as JSON
   */
  async handleOpenApiJson(_request: Request): Promise<Response> {
    return new Response(JSON.stringify(this.openApiSpec, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  /**
   * Serve OpenAPI spec as YAML
   */
  async handleOpenApiYaml(_request: Request): Promise<Response> {
    // For now, we'll convert JSON to YAML
    // In production, this would serve the actual YAML file
    const yamlContent = this.jsonToYaml(this.openApiSpec);
    
    return new Response(yamlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-yaml',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  /**
   * Simple JSON to YAML converter
   */
  private jsonToYaml(obj: any, indent: number = 0): string {
    let yaml = '';
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this.jsonToYaml(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.jsonToYaml(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        }
      } else if (typeof value === 'string' && value.includes('\n')) {
        yaml += `${spaces}${key}: |\n`;
        value.split('\n').forEach(line => {
          yaml += `${spaces}  ${line}\n`;
        });
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }
}