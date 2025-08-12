/**
 * Complete OpenAPI Specification for RapidTriageME
 */

export function getOpenApiSpec(baseUrl: string): any {
  return {
    openapi: '3.0.3',
    info: {
      title: 'RapidTriageME API',
      description: `Enterprise-grade browser automation and debugging platform with MCP protocol support.
      
## Features
- 🎯 Remote browser control and automation
- 📸 Screenshot capture with cloud storage
- 🔍 Console and network log analysis
- 📊 Lighthouse performance audits
- 🔌 Model Context Protocol (MCP) integration
- 🛡️ Enterprise security with API key management
- 📈 Real-time metrics and monitoring

## Authentication
RapidTriageME supports multiple authentication methods:

### Bearer Token
Include your API key in the Authorization header:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

### JWT Authentication
For user sessions, use JWT tokens obtained from login:
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
\`\`\`

## Rate Limiting
- Free tier: 100 requests/minute
- Pro tier: 1000 requests/minute
- Enterprise: Unlimited

## Getting Started
1. Register for an account at [/auth/register](#/Authentication/post_auth_register)
2. Generate an API key at [/auth/api-keys](#/API%20Keys/post_auth_api_keys)
3. Start making API calls with your key

## SDKs & Tools
- [JavaScript SDK](https://github.com/YarlisAISolutions/rapidtriage-js)
- [Python SDK](https://github.com/YarlisAISolutions/rapidtriage-python)
- [CLI Tool](https://github.com/YarlisAISolutions/rapidtriage-cli)
- [Postman Collection](${baseUrl}/postman-collection.json)`,
      version: '1.0.0',
      contact: {
        name: 'YarlisAISolutions Support',
        email: 'support@rapidtriage.me',
        url: 'https://rapidtriage.me'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      'x-logo': {
        url: 'https://rapidtriage.me/logo.png',
        altText: 'RapidTriageME Logo'
      }
    },
    servers: [
      {
        url: baseUrl,
        description: 'Current Environment'
      },
      {
        url: 'https://rapidtriage.me',
        description: 'Production'
      },
      {
        url: 'https://staging.rapidtriage.me',
        description: 'Staging'
      },
      {
        url: 'http://localhost:8787',
        description: 'Local Development'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
        'x-displayName': '🔐 Authentication'
      },
      {
        name: 'API Keys',
        description: 'API key generation and management',
        'x-displayName': '🔑 API Keys'
      },
      {
        name: 'Browser Control',
        description: 'Browser navigation and control operations',
        'x-displayName': '🌐 Browser Control'
      },
      {
        name: 'Screenshots',
        description: 'Screenshot capture and management',
        'x-displayName': '📸 Screenshots'
      },
      {
        name: 'Debugging',
        description: 'Console logs, network analysis, and debugging tools',
        'x-displayName': '🔍 Debugging'
      },
      {
        name: 'Audits',
        description: 'Performance, accessibility, and SEO audits',
        'x-displayName': '📊 Audits'
      },
      {
        name: 'MCP',
        description: 'Model Context Protocol endpoints',
        'x-displayName': '🔌 MCP Protocol'
      },
      {
        name: 'Monitoring',
        description: 'Health checks and metrics',
        'x-displayName': '📈 Monitoring'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT or API Key authentication'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key authentication (alternative to Bearer)'
        }
      },
      schemas: {
        // User and Authentication Schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin', 'enterprise'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            emailVerified: { type: 'boolean' },
            twoFactorEnabled: { type: 'boolean' },
            subscription: {
              type: 'object',
              properties: {
                plan: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
                expiresAt: { type: 'string', format: 'date-time' },
                requestLimit: { type: 'integer' }
              }
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            twoFactorCode: { type: 'string', pattern: '^[0-9]{6}$' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string', description: 'JWT token' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'integer', description: 'Token expiry in seconds' },
            user: { '$ref': '#/components/schemas/User' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string' },
            company: { type: 'string' },
            referralCode: { type: 'string' }
          }
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            key: { type: 'string', description: 'API key (only shown once)' },
            prefix: { type: 'string', description: 'Key prefix for identification' },
            createdAt: { type: 'string', format: 'date-time' },
            lastUsedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
            requestCount: { type: 'integer' },
            rateLimit: { type: 'integer', description: 'Requests per minute' },
            permissions: {
              type: 'array',
              items: { type: 'string' }
            },
            ipWhitelist: {
              type: 'array',
              items: { type: 'string', format: 'ipv4' }
            }
          }
        },
        CreateApiKeyRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', description: 'Friendly name for the key' },
            expiresIn: { type: 'integer', description: 'Expiry in days (0 for never)' },
            rateLimit: { type: 'integer', description: 'Custom rate limit' },
            permissions: {
              type: 'array',
              items: { 
                type: 'string',
                enum: ['read', 'write', 'delete', 'admin']
              }
            },
            ipWhitelist: {
              type: 'array',
              items: { type: 'string', format: 'ipv4' }
            }
          }
        },
        // Browser Operation Schemas
        NavigateRequest: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', format: 'uri' },
            waitUntil: {
              type: 'string',
              enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
              default: 'load'
            },
            timeout: { type: 'integer', default: 30000 },
            viewport: {
              type: 'object',
              properties: {
                width: { type: 'integer', default: 1920 },
                height: { type: 'integer', default: 1080 }
              }
            },
            userAgent: { type: 'string' },
            extraHeaders: {
              type: 'object',
              additionalProperties: { type: 'string' }
            }
          }
        },
        ScreenshotRequest: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', format: 'uri' },
            fullPage: { type: 'boolean', default: false },
            format: { type: 'string', enum: ['png', 'jpeg', 'webp'], default: 'png' },
            quality: { type: 'integer', minimum: 0, maximum: 100, default: 90 },
            viewport: {
              type: 'object',
              properties: {
                width: { type: 'integer' },
                height: { type: 'integer' }
              }
            },
            selector: { type: 'string', description: 'CSS selector to screenshot' },
            waitFor: { type: 'string', description: 'Selector to wait for before capture' },
            delay: { type: 'integer', description: 'Delay in ms before capture' }
          }
        },
        ScreenshotResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            url: { type: 'string', description: 'Public URL to access screenshot' },
            thumbnailUrl: { type: 'string' },
            size: { type: 'integer', description: 'File size in bytes' },
            dimensions: {
              type: 'object',
              properties: {
                width: { type: 'integer' },
                height: { type: 'integer' }
              }
            },
            format: { type: 'string' },
            capturedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        },
        ConsoleLogRequest: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri' },
            level: {
              type: 'string',
              enum: ['all', 'error', 'warn', 'info', 'log', 'debug'],
              default: 'all'
            },
            limit: { type: 'integer', default: 100 },
            since: { type: 'string', format: 'date-time' }
          }
        },
        ConsoleLog: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['error', 'warn', 'info', 'log', 'debug'] },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            source: { type: 'string' },
            stackTrace: { type: 'string' },
            args: { type: 'array', items: {} }
          }
        },
        NetworkLogRequest: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri' },
            filter: {
              type: 'object',
              properties: {
                status: { type: 'array', items: { type: 'integer' } },
                method: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['xhr', 'fetch', 'script', 'stylesheet', 'image', 'font', 'document', 'websocket']
                },
                domain: { type: 'string' }
              }
            },
            includeHeaders: { type: 'boolean', default: false },
            includeBody: { type: 'boolean', default: false },
            limit: { type: 'integer', default: 50 }
          }
        },
        NetworkLog: {
          type: 'object',
          properties: {
            requestId: { type: 'string' },
            method: { type: 'string' },
            url: { type: 'string' },
            status: { type: 'integer' },
            statusText: { type: 'string' },
            responseTime: { type: 'number' },
            size: { type: 'integer' },
            type: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            headers: {
              type: 'object',
              properties: {
                request: { type: 'object', additionalProperties: { type: 'string' } },
                response: { type: 'object', additionalProperties: { type: 'string' } }
              }
            },
            body: {
              type: 'object',
              properties: {
                request: { type: 'string' },
                response: { type: 'string' }
              }
            }
          }
        },
        LighthouseRequest: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', format: 'uri' },
            categories: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa']
              },
              default: ['performance', 'accessibility']
            },
            device: { type: 'string', enum: ['mobile', 'desktop'], default: 'desktop' },
            throttling: {
              type: 'object',
              properties: {
                cpuSlowdown: { type: 'number', default: 1 },
                networkThrottle: { type: 'string', enum: ['none', '3g', '4g'], default: 'none' }
              }
            }
          }
        },
        LighthouseReport: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            fetchTime: { type: 'string', format: 'date-time' },
            scores: {
              type: 'object',
              properties: {
                performance: { type: 'number', minimum: 0, maximum: 100 },
                accessibility: { type: 'number', minimum: 0, maximum: 100 },
                bestPractices: { type: 'number', minimum: 0, maximum: 100 },
                seo: { type: 'number', minimum: 0, maximum: 100 },
                pwa: { type: 'number', minimum: 0, maximum: 100 }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                firstContentfulPaint: { type: 'number' },
                largestContentfulPaint: { type: 'number' },
                firstInputDelay: { type: 'number' },
                timeToInteractive: { type: 'number' },
                speedIndex: { type: 'number' },
                totalBlockingTime: { type: 'number' },
                cumulativeLayoutShift: { type: 'number' }
              }
            },
            audits: { type: 'array', items: { type: 'object' } },
            reportUrl: { type: 'string', description: 'URL to full HTML report' }
          }
        },
        ElementInspection: {
          type: 'object',
          properties: {
            selector: { type: 'string' },
            exists: { type: 'boolean' },
            visible: { type: 'boolean' },
            tagName: { type: 'string' },
            attributes: { type: 'object', additionalProperties: { type: 'string' } },
            computedStyles: { type: 'object', additionalProperties: { type: 'string' } },
            innerText: { type: 'string' },
            innerHTML: { type: 'string' },
            boundingBox: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' }
              }
            },
            screenshot: { type: 'string', description: 'Base64 encoded screenshot of element' }
          }
        },
        ExecuteJavaScriptRequest: {
          type: 'object',
          required: ['script'],
          properties: {
            url: { type: 'string', format: 'uri' },
            script: { type: 'string', description: 'JavaScript code to execute' },
            args: { type: 'array', items: {}, description: 'Arguments to pass to script' },
            awaitPromise: { type: 'boolean', default: false },
            timeout: { type: 'integer', default: 5000 }
          }
        },
        TriageReport: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            url: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            summary: {
              type: 'object',
              properties: {
                errors: { type: 'integer' },
                warnings: { type: 'integer' },
                performanceScore: { type: 'number' },
                accessibilityIssues: { type: 'integer' }
              }
            },
            screenshot: { '$ref': '#/components/schemas/ScreenshotResponse' },
            consoleLogs: {
              type: 'array',
              items: { '$ref': '#/components/schemas/ConsoleLog' }
            },
            networkLogs: {
              type: 'array',
              items: { '$ref': '#/components/schemas/NetworkLog' }
            },
            lighthouse: { '$ref': '#/components/schemas/LighthouseReport' },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  category: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  solution: { type: 'string' }
                }
              }
            }
          }
        },
        // Common Schemas
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            version: { type: 'string' },
            environment: { type: 'string' },
            uptime: { type: 'integer' },
            timestamp: { type: 'string', format: 'date-time' },
            services: {
              type: 'object',
              additionalProperties: {
                type: 'string',
                enum: ['operational', 'degraded', 'down', 'unavailable']
              }
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required or invalid credentials',
          content: {
            'application/json': {
              schema: { '$ref': '#/components/schemas/Error' },
              example: {
                error: 'Unauthorized',
                message: 'Invalid or missing authentication token',
                code: 'AUTH_REQUIRED'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { '$ref': '#/components/schemas/Error' },
              example: {
                error: 'Forbidden',
                message: 'You do not have permission to access this resource',
                code: 'INSUFFICIENT_PERMISSIONS'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { '$ref': '#/components/schemas/Error' },
              example: {
                error: 'Not Found',
                message: 'The requested resource was not found',
                code: 'RESOURCE_NOT_FOUND'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          headers: {
            'X-RateLimit-Limit': {
              description: 'Request limit per minute',
              schema: { type: 'integer' }
            },
            'X-RateLimit-Remaining': {
              description: 'Remaining requests',
              schema: { type: 'integer' }
            },
            'X-RateLimit-Reset': {
              description: 'UTC timestamp when limit resets',
              schema: { type: 'integer' }
            }
          },
          content: {
            'application/json': {
              schema: { '$ref': '#/components/schemas/Error' },
              example: {
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
              }
            }
          }
        },
        ValidationError: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: { '$ref': '#/components/schemas/Error' },
              example: {
                error: 'Validation Error',
                message: 'Invalid request parameters',
                code: 'VALIDATION_ERROR',
                details: {
                  fields: {
                    email: 'Invalid email format',
                    password: 'Password must be at least 8 characters'
                  }
                }
              }
            }
          }
        }
      }
    },
    paths: {
      // Authentication Endpoints
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register new user',
          description: 'Create a new user account with email and password',
          operationId: 'register',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/RegisterRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/LoginResponse' }
                }
              }
            },
            '400': { '$ref': '#/components/responses/ValidationError' },
            '409': {
              description: 'User already exists',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User login',
          description: 'Authenticate with email and password to receive JWT token',
          operationId: 'login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/LoginRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/LoginResponse' }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' },
            '429': { '$ref': '#/components/responses/RateLimitError' }
          }
        }
      },
      '/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Logout user',
          description: 'Invalidate current session token',
          operationId: 'logout',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Logout successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/auth/refresh': {
        post: {
          tags: ['Authentication'],
          summary: 'Refresh access token',
          description: 'Exchange refresh token for new access token',
          operationId: 'refreshToken',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Token refreshed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      expiresIn: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/auth/profile': {
        get: {
          tags: ['Authentication'],
          summary: 'Get user profile',
          description: 'Retrieve current user profile information',
          operationId: 'getProfile',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/User' }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        },
        put: {
          tags: ['Authentication'],
          summary: 'Update user profile',
          description: 'Update current user profile information',
          operationId: 'updateProfile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    company: { type: 'string' },
                    twoFactorEnabled: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Profile updated',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/User' }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        }
      },
      // API Key Management
      '/auth/api-keys': {
        get: {
          tags: ['API Keys'],
          summary: 'List API keys',
          description: 'Get all API keys for current user',
          operationId: 'listApiKeys',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 }
            }
          ],
          responses: {
            '200': {
              description: 'List of API keys',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { '$ref': '#/components/schemas/PaginatedResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { '$ref': '#/components/schemas/ApiKey' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        },
        post: {
          tags: ['API Keys'],
          summary: 'Create API key',
          description: 'Generate a new API key for authentication',
          operationId: 'createApiKey',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/CreateApiKeyRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: 'API key created',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/ApiKey' }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' },
            '403': { '$ref': '#/components/responses/ForbiddenError' }
          }
        }
      },
      '/auth/api-keys/{keyId}': {
        get: {
          tags: ['API Keys'],
          summary: 'Get API key details',
          description: 'Retrieve details of a specific API key',
          operationId: 'getApiKey',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'keyId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'API key details',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/ApiKey' }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' },
            '404': { '$ref': '#/components/responses/NotFoundError' }
          }
        },
        put: {
          tags: ['API Keys'],
          summary: 'Update API key',
          description: 'Update API key settings',
          operationId: 'updateApiKey',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'keyId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    rateLimit: { type: 'integer' },
                    permissions: { type: 'array', items: { type: 'string' } },
                    ipWhitelist: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'API key updated',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/ApiKey' }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' },
            '404': { '$ref': '#/components/responses/NotFoundError' }
          }
        },
        delete: {
          tags: ['API Keys'],
          summary: 'Revoke API key',
          description: 'Permanently revoke an API key',
          operationId: 'revokeApiKey',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'keyId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '204': {
              description: 'API key revoked'
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' },
            '404': { '$ref': '#/components/responses/NotFoundError' }
          }
        }
      },
      // Browser Control Endpoints
      '/api/navigate': {
        post: {
          tags: ['Browser Control'],
          summary: 'Navigate to URL',
          description: 'Navigate browser to specified URL and wait for page load',
          operationId: 'navigate',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/NavigateRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Navigation successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      url: { type: 'string' },
                      title: { type: 'string' },
                      loadTime: { type: 'number' }
                    }
                  }
                }
              }
            },
            '400': { '$ref': '#/components/responses/ValidationError' },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/api/screenshot': {
        post: {
          tags: ['Screenshots'],
          summary: 'Capture screenshot',
          description: 'Take a screenshot of a webpage with various options',
          operationId: 'captureScreenshot',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/ScreenshotRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Screenshot captured',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/ScreenshotResponse' }
                }
              }
            },
            '400': { '$ref': '#/components/responses/ValidationError' },
            '401': { '$ref': '#/components/responses/UnauthorizedError' },
            '429': { '$ref': '#/components/responses/RateLimitError' }
          }
        }
      },
      '/api/screenshots': {
        get: {
          tags: ['Screenshots'],
          summary: 'List screenshots',
          description: 'Get list of captured screenshots with filtering options',
          operationId: 'listScreenshots',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 }
            },
            {
              name: 'domain',
              in: 'query',
              schema: { type: 'string' }
            },
            {
              name: 'from',
              in: 'query',
              schema: { type: 'string', format: 'date-time' }
            },
            {
              name: 'to',
              in: 'query',
              schema: { type: 'string', format: 'date-time' }
            }
          ],
          responses: {
            '200': {
              description: 'List of screenshots',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { '$ref': '#/components/schemas/PaginatedResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { '$ref': '#/components/schemas/ScreenshotResponse' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/api/screenshots/{id}': {
        get: {
          tags: ['Screenshots'],
          summary: 'Get screenshot',
          description: 'Retrieve a specific screenshot by ID',
          operationId: 'getScreenshot',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Screenshot details',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/ScreenshotResponse' }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' },
            '404': { '$ref': '#/components/responses/NotFoundError' }
          }
        },
        delete: {
          tags: ['Screenshots'],
          summary: 'Delete screenshot',
          description: 'Delete a screenshot from storage',
          operationId: 'deleteScreenshot',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '204': {
              description: 'Screenshot deleted'
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' },
            '404': { '$ref': '#/components/responses/NotFoundError' }
          }
        }
      },
      // Debugging Endpoints
      '/api/console-logs': {
        post: {
          tags: ['Debugging'],
          summary: 'Get console logs',
          description: 'Retrieve browser console logs from a webpage',
          operationId: 'getConsoleLogs',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/ConsoleLogRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Console logs retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      logs: {
                        type: 'array',
                        items: { '$ref': '#/components/schemas/ConsoleLog' }
                      },
                      url: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/api/network-logs': {
        post: {
          tags: ['Debugging'],
          summary: 'Get network logs',
          description: 'Retrieve network request logs from browser',
          operationId: 'getNetworkLogs',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/NetworkLogRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Network logs retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      logs: {
                        type: 'array',
                        items: { '$ref': '#/components/schemas/NetworkLog' }
                      },
                      url: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/api/inspect-element': {
        post: {
          tags: ['Debugging'],
          summary: 'Inspect DOM element',
          description: 'Get detailed information about a DOM element',
          operationId: 'inspectElement',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['selector'],
                  properties: {
                    url: { type: 'string', format: 'uri' },
                    selector: { type: 'string' },
                    includeScreenshot: { type: 'boolean', default: false }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Element inspection data',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/ElementInspection' }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' },
            '404': { '$ref': '#/components/responses/NotFoundError' }
          }
        }
      },
      '/api/execute-js': {
        post: {
          tags: ['Debugging'],
          summary: 'Execute JavaScript',
          description: 'Execute JavaScript code in browser context',
          operationId: 'executeJavaScript',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/ExecuteJavaScriptRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Script execution result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      result: {},
                      console: {
                        type: 'array',
                        items: { '$ref': '#/components/schemas/ConsoleLog' }
                      },
                      error: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { '$ref': '#/components/responses/ValidationError' },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        }
      },
      // Audit Endpoints
      '/api/lighthouse': {
        post: {
          tags: ['Audits'],
          summary: 'Run Lighthouse audit',
          description: 'Perform comprehensive Lighthouse audit on a webpage',
          operationId: 'runLighthouseAudit',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/LighthouseRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Lighthouse audit report',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/LighthouseReport' }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' },
            '429': { '$ref': '#/components/responses/RateLimitError' }
          }
        }
      },
      '/api/triage-report': {
        post: {
          tags: ['Audits'],
          summary: 'Generate triage report',
          description: 'Generate comprehensive debugging and analysis report',
          operationId: 'generateTriageReport',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['url'],
                  properties: {
                    url: { type: 'string', format: 'uri' },
                    includeScreenshot: { type: 'boolean', default: true },
                    includeLogs: { type: 'boolean', default: true },
                    includeLighthouse: { type: 'boolean', default: false },
                    format: { type: 'string', enum: ['json', 'html', 'pdf'], default: 'json' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Triage report generated',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/TriageReport' }
                },
                'text/html': {
                  schema: { type: 'string' }
                },
                'application/pdf': {
                  schema: { type: 'string', format: 'binary' }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' },
            '429': { '$ref': '#/components/responses/RateLimitError' }
          }
        }
      },
      // MCP Protocol Endpoints
      '/sse': {
        get: {
          tags: ['MCP'],
          summary: 'SSE connection',
          description: 'Establish Server-Sent Events connection for MCP protocol',
          operationId: 'sseConnection',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'Accept',
              in: 'header',
              required: true,
              schema: { type: 'string', enum: ['text/event-stream'] }
            }
          ],
          responses: {
            '200': {
              description: 'SSE stream established',
              content: {
                'text/event-stream': {
                  schema: { type: 'string' }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/mcp': {
        post: {
          tags: ['MCP'],
          summary: 'MCP JSON-RPC',
          description: 'Execute MCP protocol commands via JSON-RPC',
          operationId: 'mcpJsonRpc',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['jsonrpc', 'method', 'id'],
                  properties: {
                    jsonrpc: { type: 'string', enum: ['2.0'] },
                    method: { type: 'string' },
                    params: { type: 'object' },
                    id: { type: 'string' }
                  }
                },
                examples: {
                  listTools: {
                    summary: 'List available tools',
                    value: {
                      jsonrpc: '2.0',
                      method: 'tools/list',
                      params: {},
                      id: '1'
                    }
                  },
                  callTool: {
                    summary: 'Call a tool',
                    value: {
                      jsonrpc: '2.0',
                      method: 'tools/call',
                      params: {
                        name: 'remote_capture_screenshot',
                        arguments: {
                          url: 'https://example.com'
                        }
                      },
                      id: '2'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'MCP response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      jsonrpc: { type: 'string' },
                      result: { type: 'object' },
                      error: { type: 'object' },
                      id: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        }
      },
      // Monitoring Endpoints
      '/health': {
        get: {
          tags: ['Monitoring'],
          summary: 'Health check',
          description: 'Check service health and component status',
          operationId: 'healthCheck',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/HealthStatus' }
                }
              }
            },
            '503': {
              description: 'Service is unhealthy',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/HealthStatus' }
                }
              }
            }
          }
        }
      },
      '/metrics': {
        get: {
          tags: ['Monitoring'],
          summary: 'Service metrics',
          description: 'Get service performance and usage metrics',
          operationId: 'getMetrics',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Service metrics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      requests: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer' },
                          successful: { type: 'integer' },
                          failed: { type: 'integer' },
                          rate: { type: 'number' }
                        }
                      },
                      performance: {
                        type: 'object',
                        properties: {
                          avgResponseTime: { type: 'number' },
                          p95ResponseTime: { type: 'number' },
                          p99ResponseTime: { type: 'number' }
                        }
                      },
                      uptime: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '401': { '$ref': '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/status': {
        get: {
          tags: ['Monitoring'],
          summary: 'Status page',
          description: 'Interactive status page with service health',
          operationId: 'statusPage',
          responses: {
            '200': {
              description: 'Status page HTML',
              content: {
                'text/html': {
                  schema: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  };
}