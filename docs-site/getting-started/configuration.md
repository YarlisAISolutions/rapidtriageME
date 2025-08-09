# Configuration Guide

Learn how to configure RapidTriageME for your specific needs, from basic setup to advanced customization.

## Overview

RapidTriageME offers flexible configuration through multiple methods:

- **Environment Variables** - For system-wide settings
- **Configuration Files** - For persistent project-specific settings
- **Runtime Parameters** - For temporary overrides
- **IDE Integration** - For AI assistant configuration

## Configuration Methods

### Environment Variables

The most common way to configure RapidTriageME is through environment variables.

#### Core Settings

```bash
# Server Configuration
export RAPIDTRIAGE_PORT=1421              # Port for browser connector server
export RAPIDTRIAGE_HOST=localhost         # Host address to bind to
export RAPIDTRIAGE_CORS_ORIGIN=*          # CORS origin (use specific domains in production)

# Logging Configuration
export NODE_ENV=development                # Environment mode (development/production)
export LOG_LEVEL=info                      # Logging level (error/warn/info/debug/trace)
export DEBUG=rapidtriage:*                 # Debug namespaces

# Feature Toggles
export RAPIDTRIAGE_ENABLE_SCREENSHOTS=true # Enable screenshot capture
export RAPIDTRIAGE_ENABLE_LIGHTHOUSE=true  # Enable Lighthouse audits
export RAPIDTRIAGE_ENABLE_AUTH=false      # Enable authentication (for production)
```

#### Performance Settings

```bash
# Screenshot Configuration
export RAPIDTRIAGE_SCREENSHOT_MAX_WIDTH=1920
export RAPIDTRIAGE_SCREENSHOT_MAX_HEIGHT=1080
export RAPIDTRIAGE_SCREENSHOT_QUALITY=80

# Memory and Performance
export RAPIDTRIAGE_MAX_LOG_ENTRIES=1000   # Maximum console log entries to store
export RAPIDTRIAGE_MAX_NETWORK_ENTRIES=500 # Maximum network requests to store
export RAPIDTRIAGE_CLEANUP_INTERVAL=300000 # Cleanup interval in ms (5 minutes)

# Timeouts
export RAPIDTRIAGE_CONNECTION_TIMEOUT=30000  # WebSocket connection timeout
export RAPIDTRIAGE_REQUEST_TIMEOUT=10000     # HTTP request timeout
export RAPIDTRIAGE_LIGHTHOUSE_TIMEOUT=60000  # Lighthouse audit timeout
```

#### Platform-Specific Setup

=== "macOS/Linux"
    
    ```bash
    # Add to ~/.bashrc or ~/.zshrc
    cat >> ~/.bashrc << 'EOF'
    
    # RapidTriageME Configuration
    export RAPIDTRIAGE_PORT=1421
    export RAPIDTRIAGE_HOST=localhost
    export NODE_ENV=development
    export LOG_LEVEL=info
    export RAPIDTRIAGE_ENABLE_SCREENSHOTS=true
    export RAPIDTRIAGE_ENABLE_LIGHTHOUSE=true
    
    EOF
    
    # Reload configuration
    source ~/.bashrc
    ```

=== "Windows PowerShell"
    
    ```powershell
    # Set persistent environment variables
    [Environment]::SetEnvironmentVariable("RAPIDTRIAGE_PORT", "1421", "User")
    [Environment]::SetEnvironmentVariable("RAPIDTRIAGE_HOST", "localhost", "User")
    [Environment]::SetEnvironmentVariable("NODE_ENV", "development", "User")
    [Environment]::SetEnvironmentVariable("LOG_LEVEL", "info", "User")
    
    # Restart PowerShell to apply changes
    ```

=== "Windows Command Prompt"
    
    ```cmd
    setx RAPIDTRIAGE_PORT 1421
    setx RAPIDTRIAGE_HOST localhost
    setx NODE_ENV development
    setx LOG_LEVEL info
    
    rem Restart Command Prompt to apply changes
    ```

### Configuration Files

For more complex setups, use configuration files.

#### Global Configuration

Create a global configuration file:

```bash
# Create config directory
mkdir -p ~/.rapidtriage

# Create configuration file
cat > ~/.rapidtriage/config.json << 'EOF'
{
  "server": {
    "port": 1421,
    "host": "localhost",
    "cors": {
      "origin": "*",
      "credentials": true
    }
  },
  "logging": {
    "level": "info",
    "format": "combined",
    "enableColors": true
  },
  "features": {
    "screenshots": {
      "enabled": true,
      "maxWidth": 1920,
      "maxHeight": 1080,
      "quality": 80,
      "format": "png"
    },
    "lighthouse": {
      "enabled": true,
      "timeout": 60000,
      "categories": ["performance", "accessibility", "best-practices", "seo"]
    },
    "networking": {
      "maxLogEntries": 1000,
      "maxNetworkEntries": 500,
      "enableRequestInterception": true
    }
  },
  "security": {
    "enableAuth": false,
    "rateLimiting": {
      "enabled": true,
      "windowMs": 60000,
      "max": 100
    }
  }
}
EOF
```

#### Project-Specific Configuration

Create a project-specific configuration:

```json
// rapidtriage.config.json (in your project root)
{
  "extends": "~/.rapidtriage/config.json",
  "server": {
    "port": 3030  // Override global port
  },
  "features": {
    "lighthouse": {
      "categories": ["performance"]  // Only run performance audits
    }
  },
  "project": {
    "name": "My Web App",
    "baseUrl": "http://localhost:3000",
    "testPages": [
      "/",
      "/about",
      "/contact"
    ]
  }
}
```

### IDE Configuration

Configure your AI assistant to work with RapidTriageME.

#### Cursor IDE

```json
// ~/.cursor/mcp_settings.json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlisai/rapidtriage-mcp"],
      "env": {
        "BROWSER_TOOLS_PORT": "1421",
        "BROWSER_TOOLS_HOST": "localhost",
        "NODE_ENV": "development",
        "LOG_LEVEL": "info",
        "DEBUG": "rapidtriage:*"
      }
    }
  }
}
```

#### VS Code with Continue

```json
// ~/.continue/config.json
{
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "your-anthropic-api-key"
    }
  ],
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlisai/rapidtriage-mcp"],
      "env": {
        "BROWSER_TOOLS_PORT": "1421",
        "BROWSER_TOOLS_HOST": "localhost",
        "RAPIDTRIAGE_CONFIG_PATH": "./rapidtriage.config.json"
      }
    }
  },
  "customCommands": [
    {
      "name": "debug-page",
      "prompt": "Use RapidTriageME to take a screenshot, check console logs, and run a performance audit on the current page. Provide a comprehensive analysis."
    }
  ]
}
```

#### Claude Desktop

```json
// ~/Library/Application Support/Claude/config.json (macOS)
// %APPDATA%\Claude\config.json (Windows)
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlisai/rapidtriage-mcp"],
      "env": {
        "BROWSER_TOOLS_PORT": "1421",
        "DEBUG": "true",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

#### Zed Editor

```json
// ~/.config/zed/settings.json
{
  "language_servers": {
    "rapidtriage-mcp": {
      "command": "npx",
      "args": ["@yarlisai/rapidtriage-mcp"],
      "env": {
        "BROWSER_TOOLS_PORT": "1421",
        "NODE_ENV": "development"
      }
    }
  }
}
```

## Advanced Configuration

### Custom Tool Configuration

Configure specific tools and their behavior:

```json
{
  "tools": {
    "screenshot": {
      "defaultOptions": {
        "fullPage": true,
        "captureBeyondViewport": true,
        "optimizeForSpeed": false
      }
    },
    "lighthouse": {
      "defaultConfig": {
        "extends": "lighthouse:default",
        "settings": {
          "onlyCategories": ["performance", "accessibility"],
          "skipAudits": ["screenshot-thumbnails"],
          "throttling": {
            "cpuSlowdownMultiplier": 4,
            "throughputKbps": 1638.4,
            "requestLatencyMs": 150
          }
        }
      }
    },
    "console": {
      "filters": {
        "includeTypes": ["error", "warn", "info"],
        "excludePatterns": [
          "Download the React DevTools",
          "Warning: React.createFactory"
        ]
      }
    }
  }
}
```

### Multi-Environment Setup

Configure different environments:

```json
{
  "environments": {
    "development": {
      "server": {
        "port": 1421,
        "host": "localhost"
      },
      "logging": {
        "level": "debug"
      },
      "features": {
        "lighthouse": {
          "enabled": true,
          "categories": ["performance"]
        }
      }
    },
    "staging": {
      "server": {
        "port": 1422,
        "host": "0.0.0.0"
      },
      "logging": {
        "level": "info"
      },
      "features": {
        "lighthouse": {
          "categories": ["performance", "accessibility", "seo"]
        }
      }
    },
    "production": {
      "server": {
        "port": 1421,
        "host": "127.0.0.1"
      },
      "logging": {
        "level": "warn"
      },
      "security": {
        "enableAuth": true,
        "allowedOrigins": ["https://yourdomain.com"]
      }
    }
  }
}
```

Use environment-specific configuration:

```bash
# Set active environment
export RAPIDTRIAGE_ENV=staging

# Start server with environment config
npx @yarlisai/rapidtriage-server --env=staging
```

### Cloud Deployment Configuration

Configure for Cloudflare Workers deployment:

```toml
# wrangler.toml
name = "rapidtriage-mcp"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

[env.production]
route = { pattern = "rapidtriage.me/mcp/*", zone_name = "rapidtriage.me" }

[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "warn"
ENABLE_AUTH = "true"
CORS_ORIGIN = "https://rapidtriage.me"

# KV namespace for session storage
[[env.production.kv_namespaces]]
binding = "SESSIONS"
id = "your-production-kv-namespace-id"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-cache-kv-namespace-id"

# Durable Objects
[[env.production.durable_objects.bindings]]
name = "SESSION_MANAGER"
class_name = "SessionManager"

[env.staging]
route = { pattern = "staging.rapidtriage.me/mcp/*", zone_name = "rapidtriage.me" }

[env.staging.vars]
ENVIRONMENT = "staging"
LOG_LEVEL = "info"
ENABLE_AUTH = "false"
```

### Authentication Configuration

Configure authentication for production deployments:

```json
{
  "security": {
    "enableAuth": true,
    "authMethods": ["jwt", "apiKey"],
    "jwt": {
      "secret": "${JWT_SECRET}",
      "expiresIn": "24h",
      "issuer": "rapidtriage.me",
      "audience": "rapidtriage-clients"
    },
    "apiKeys": {
      "enabled": true,
      "prefix": "rt_",
      "length": 32
    },
    "rateLimiting": {
      "enabled": true,
      "windowMs": 60000,
      "max": 100,
      "skipSuccessfulRequests": false
    },
    "cors": {
      "origin": ["https://rapidtriage.me"],
      "credentials": true,
      "allowedHeaders": ["Authorization", "Content-Type"]
    }
  }
}
```

## Configuration Loading Priority

RapidTriageME loads configuration in this order (later sources override earlier ones):

1. **Built-in defaults** - Sensible defaults for all settings
2. **Global config file** - `~/.rapidtriage/config.json`
3. **Project config file** - `./rapidtriage.config.json`
4. **Environment variables** - `RAPIDTRIAGE_*` variables
5. **Command line arguments** - `--port`, `--host`, etc.

## Environment-Specific Examples

### Local Development

```bash
# .env.local
RAPIDTRIAGE_PORT=1421
RAPIDTRIAGE_HOST=localhost
NODE_ENV=development
LOG_LEVEL=debug
RAPIDTRIAGE_ENABLE_SCREENSHOTS=true
RAPIDTRIAGE_ENABLE_LIGHTHOUSE=true
RAPIDTRIAGE_SCREENSHOT_QUALITY=90
```

### CI/CD Pipeline

```bash
# .env.ci
RAPIDTRIAGE_PORT=1421
RAPIDTRIAGE_HOST=127.0.0.1
NODE_ENV=test
LOG_LEVEL=warn
RAPIDTRIAGE_ENABLE_SCREENSHOTS=false  # Disable in headless CI
RAPIDTRIAGE_ENABLE_LIGHTHOUSE=true
RAPIDTRIAGE_LIGHTHOUSE_TIMEOUT=30000  # Shorter timeout for CI
```

### Production

```bash
# .env.production
RAPIDTRIAGE_PORT=1421
RAPIDTRIAGE_HOST=127.0.0.1
NODE_ENV=production
LOG_LEVEL=error
RAPIDTRIAGE_ENABLE_AUTH=true
RAPIDTRIAGE_CORS_ORIGIN=https://yourdomain.com
RAPIDTRIAGE_RATE_LIMIT_MAX=1000
```

## Validation and Testing

### Validate Configuration

```bash
# Test configuration loading
npx @yarlisai/rapidtriage-server --validate-config

# Check environment variables
npx @yarlisai/rapidtriage-server --show-config

# Test specific configuration file
npx @yarlisai/rapidtriage-server --config ./custom-config.json --validate-config
```

### Configuration Schema

RapidTriageME validates configuration against a JSON schema:

```json
{
  "$schema": "https://rapidtriage.me/schema/config.json",
  "type": "object",
  "properties": {
    "server": {
      "type": "object",
      "properties": {
        "port": {
          "type": "integer",
          "minimum": 1000,
          "maximum": 65535
        },
        "host": {
          "type": "string",
          "format": "hostname"
        }
      }
    }
  }
}
```

## Troubleshooting Configuration

### Common Configuration Issues

#### Port Already in Use

```bash
# Check what's using the port
lsof -i :1421

# Use a different port
export RAPIDTRIAGE_PORT=3030
npx @yarlisai/rapidtriage-server
```

#### Permission Denied

```bash
# Use unprivileged port (>1024)
export RAPIDTRIAGE_PORT=8080

# Or run with sudo (not recommended)
sudo RAPIDTRIAGE_PORT=80 npx @yarlisai/rapidtriage-server
```

#### Configuration Not Loading

```bash
# Check configuration file exists and is readable
ls -la ~/.rapidtriage/config.json

# Check JSON syntax
npx @yarlisai/rapidtriage-server --validate-config --verbose

# Enable debug logging
DEBUG=rapidtriage:config npx @yarlisai/rapidtriage-server
```

### Debug Configuration

```bash
# Enable verbose logging for configuration
export DEBUG=rapidtriage:config,rapidtriage:server
export LOG_LEVEL=debug

# Start server with debugging
npx @yarlisai/rapidtriage-server --verbose
```

## Best Practices

### Development Environment

1. **Use environment files** - Keep sensitive data out of code
2. **Enable debug logging** - Set `LOG_LEVEL=debug` during development
3. **Use project-specific config** - Create `rapidtriage.config.json` in your project
4. **Test configuration changes** - Use `--validate-config` flag

### Production Environment

1. **Use environment variables** - Never commit secrets to version control
2. **Enable authentication** - Set `RAPIDTRIAGE_ENABLE_AUTH=true`
3. **Restrict CORS** - Set specific origins instead of `*`
4. **Enable rate limiting** - Protect against abuse
5. **Use HTTPS** - Always use secure connections in production

### Performance Optimization

1. **Limit log entries** - Set reasonable `MAX_LOG_ENTRIES`
2. **Configure timeouts** - Set appropriate timeout values
3. **Optimize screenshots** - Balance quality and performance
4. **Enable cleanup** - Set regular cleanup intervals

## Next Steps

Now that you've configured RapidTriageME:

1. **[Test your setup](../deployment/local-testing.md)** - Verify everything works correctly
2. **[Learn debugging techniques](../guides/debugging.md)** - Master browser debugging
3. **[Explore the API](../api/index.md)** - Understand available tools and methods
4. **[Deploy to production](../deployment/cloudflare.md)** - Take it live

---

**Configuration complete!** RapidTriageME is now tailored to your specific needs and environment.