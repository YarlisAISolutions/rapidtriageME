/**
 * API Documentation HTTP Function
 * Serves OpenAPI/Swagger documentation
 */

import { onRequest, HttpsOptions } from 'firebase-functions/v2/https';
import { getCorsHeaders } from '../../config/cors.config.js';
import { ENVIRONMENT } from '../../config/secrets.js';

/**
 * OpenAPI specification
 */
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'RapidTriageME API',
    description: 'Browser debugging and monitoring platform API',
    version: '1.0.0',
    contact: {
      name: 'YarlisAISolutions',
      url: 'https://rapidtriage.me',
      email: 'support@rapidtriage.me',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'https://rapidtriage.me',
      description: 'Production server',
    },
    {
      url: 'http://localhost:5001/rapidtriage-me/us-central1',
      description: 'Local development (Firebase Emulator)',
    },
  ],
  tags: [
    { name: 'Health', description: 'Service health endpoints' },
    { name: 'Authentication', description: 'Authentication and authorization' },
    { name: 'Screenshots', description: 'Screenshot capture and management' },
    { name: 'Logs', description: 'Console and network logs' },
    { name: 'Sessions', description: 'Browser session management' },
    { name: 'Audits', description: 'Lighthouse audits' },
    { name: 'MCP', description: 'Model Context Protocol endpoints' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns service health status',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
          503: {
            description: 'Service is unhealthy',
          },
        },
      },
    },
    '/auth/token': {
      post: {
        tags: ['Authentication'],
        summary: 'Exchange token',
        description: 'Exchange Firebase ID token or refresh token for access token',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  idToken: { type: 'string', description: 'Firebase ID token' },
                  refreshToken: { type: 'string', description: 'Refresh token' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token exchange successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TokenResponse' },
              },
            },
          },
          401: { description: 'Invalid token' },
        },
      },
    },
    '/auth/api-keys': {
      get: {
        tags: ['Authentication'],
        summary: 'List API keys',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of API keys',
          },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Authentication'],
        summary: 'Create API key',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  permissions: { type: 'array', items: { type: 'string' } },
                  expiresIn: { type: 'number', description: 'Days until expiration' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'API key created' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/screenshot': {
      post: {
        tags: ['Screenshots'],
        summary: 'Store screenshot',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ScreenshotRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Screenshot stored',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ScreenshotResponse' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Screenshots'],
        summary: 'List screenshots',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'cursor', in: 'query', schema: { type: 'string' } },
          { name: 'project', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of screenshots' },
        },
      },
    },
    '/api/console-logs': {
      post: {
        tags: ['Logs'],
        summary: 'Store console logs',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['logs'],
                properties: {
                  logs: { type: 'array', items: { type: 'object' } },
                  sessionId: { type: 'string' },
                  url: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Logs stored' },
        },
      },
    },
    '/api/network-logs': {
      post: {
        tags: ['Logs'],
        summary: 'Store network logs',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['logs'],
                properties: {
                  logs: { type: 'array', items: { type: 'object' } },
                  sessionId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Logs stored' },
        },
      },
    },
    '/api/session': {
      post: {
        tags: ['Sessions'],
        summary: 'Create session',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['browser', 'mcp', 'sse'] },
                  extensionId: { type: 'string' },
                  browserInfo: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Session created' },
        },
      },
    },
    '/api/lighthouse': {
      post: {
        tags: ['Audits'],
        summary: 'Run Lighthouse audit',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: { type: 'string' },
                  categories: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: ['performance', 'accessibility', 'best-practices', 'seo'],
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Audit results' },
        },
      },
    },
    '/sse': {
      get: {
        tags: ['MCP'],
        summary: 'SSE endpoint for MCP',
        description: 'Server-Sent Events endpoint for Model Context Protocol',
        responses: {
          200: {
            description: 'SSE stream',
            content: {
              'text/event-stream': {},
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'API key with rtm_ prefix (e.g., Bearer rtm_xxx)',
      },
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string' },
          checks: { type: 'object' },
        },
      },
      TokenResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              expiresIn: { type: 'number' },
            },
          },
        },
      },
      ScreenshotRequest: {
        type: 'object',
        required: ['data', 'url'],
        properties: {
          data: { type: 'string', description: 'Base64 encoded image' },
          url: { type: 'string' },
          title: { type: 'string' },
          sessionId: { type: 'string' },
          project: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      ScreenshotResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              url: { type: 'string' },
              signedUrl: { type: 'string' },
              expires: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
};

/**
 * Generate Swagger UI HTML
 */
function generateSwaggerUI(specUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RapidTriageME API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; }
    .topbar { display: none !important; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #667eea; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
}

/**
 * HTTP Function options
 */
const options: HttpsOptions = {
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 30,
  minInstances: 0,
  maxInstances: 10,
};

/**
 * API Docs HTTP Function
 * Serves /api-docs and /openapi.json
 */
export const apiDocs = onRequest(options, async (request, response) => {
  // Handle CORS
  const origin = request.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.set(key, value);
  });

  // Handle preflight
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  const path = request.path;

  // Serve OpenAPI spec as JSON
  if (path === '/openapi.json' || path === '/api-docs/openapi.json') {
    response
      .status(200)
      .set('Content-Type', 'application/json')
      .json(openApiSpec);
    return;
  }

  // Serve Swagger UI
  const env = ENVIRONMENT.value() || 'production';
  const baseUrl = env === 'production'
    ? 'https://rapidtriage.me'
    : 'http://localhost:5001/rapidtriage-me/us-central1';

  const html = generateSwaggerUI(`${baseUrl}/openapi.json`);

  response
    .status(200)
    .set('Content-Type', 'text/html')
    .send(html);
});
