# 🔧 RapidTriageME IDE Configuration Guide

## YarlisAISolutions - Multi-IDE Support

RapidTriageME works with **ALL** MCP-compatible IDEs and AI coding assistants. Below are configuration instructions for each supported platform.

---

## 🎯 Supported IDEs & Platforms

### 1. **Cursor** 
The AI-first code editor with deep MCP integration.

**Configuration file**: `~/.cursor/mcp_settings.json` (macOS/Linux) or `%APPDATA%\Cursor\mcp_settings.json` (Windows)

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp@latest"],
      "env": {
        "RAPIDTRIAGE_PORT": "3025"
      }
    }
  }
}
```

---

### 2. **Visual Studio Code (with Continue extension)**
Use the Continue extension for AI assistance with MCP support.

**Install Continue extension**:
```bash
code --install-extension continue.continue
```

**Configuration file**: `~/.continue/config.json`

```json
{
  "models": [
    {
      "title": "Claude 3",
      "provider": "anthropic",
      "model": "claude-3-opus-20240229"
    }
  ],
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp@latest"],
      "env": {
        "RAPIDTRIAGE_PORT": "3025"
      }
    }
  }
}
```

---

### 3. **Zed**
The high-performance, multiplayer code editor.

**Configuration file**: `~/.config/zed/settings.json`

```json
{
  "assistant": {
    "version": "1",
    "provider": "anthropic",
    "default_model": "claude-3-opus-20240229"
  },
  "mcp_servers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp@latest"],
      "env": {
        "RAPIDTRIAGE_PORT": "3025"
      }
    }
  }
}
```

---

### 4. **Cline (VSCode Extension)**
Autonomous coding agent that works in VS Code.

**Install Cline**:
```bash
code --install-extension saoudrizwan.claude-dev
```

**Configuration file**: Add to VS Code settings.json

```json
{
  "cline.mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp@latest"],
      "env": {
        "RAPIDTRIAGE_PORT": "3025"
      }
    }
  }
}
```

---

### 5. **Claude Desktop App**
Anthropic's official desktop application.

**Configuration file**: 
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp@latest"],
      "env": {
        "RAPIDTRIAGE_PORT": "3025"
      }
    }
  }
}
```

---

### 6. **Windsurf (by Codeium)**
The IDE that writes code with you.

**Configuration file**: `~/.windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp@latest"],
      "env": {
        "RAPIDTRIAGE_PORT": "3025"
      }
    }
  }
}
```

---

### 7. **JetBrains IDEs (IntelliJ, WebStorm, PyCharm)**
With AI Assistant plugin supporting MCP.

**Install AI Assistant Plugin**:
1. Open Settings → Plugins
2. Search for "AI Assistant"
3. Install and restart

**Configuration file**: `~/.jetbrains/ai-assistant/mcp_servers.json`

```json
{
  "servers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp@latest"],
      "env": {
        "RAPIDTRIAGE_PORT": "3025"
      }
    }
  }
}
```

---

### 8. **Neovim (with AI plugins)**
For terminal-based development with AI assistance.

**Using codecompanion.nvim**:

Add to your Neovim config:

```lua
require('codecompanion').setup({
  mcp_servers = {
    rapidtriage = {
      command = "npx",
      args = {"@yarlis/rapidtriage-mcp@latest"},
      env = {
        RAPIDTRIAGE_PORT = "3025"
      }
    }
  }
})
```

---

### 9. **Sublime Text (with LSP-AI)**
Lightweight editor with AI capabilities.

**Install Package Control and LSP-AI**:
1. Install Package Control
2. Install LSP and LSP-AI packages

**Configuration**: Preferences → Package Settings → LSP → Settings

```json
{
  "clients": {
    "lsp-ai": {
      "enabled": true,
      "mcp_servers": {
        "rapidtriage": {
          "command": ["npx", "@yarlis/rapidtriage-mcp@latest"],
          "env": {
            "RAPIDTRIAGE_PORT": "3025"
          }
        }
      }
    }
  }
}
```

---

### 10. **Generic MCP Client Configuration**
For any MCP-compatible client or custom integration.

```json
{
  "name": "rapidtriage",
  "transport": "stdio",
  "command": "npx",
  "args": ["@yarlis/rapidtriage-mcp@latest"],
  "env": {
    "RAPIDTRIAGE_PORT": "3025",
    "NODE_ENV": "production"
  },
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": true
  }
}
```

---

## 🚀 Quick Start for Any IDE

### Step 1: Start the RapidTriage Server
```bash
# In a terminal, start the middleware server
npx @yarlis/rapidtriage-server@latest
```

### Step 2: Configure Your IDE
Use the configuration for your specific IDE from above.

### Step 3: Install Chrome Extension
Download and install the RapidTriage Chrome Extension for browser integration.

### Step 4: Test the Connection
In your AI assistant, try:
```
"Take a screenshot of the current browser tab"
```

---

## 🔌 Environment Variables

All IDEs support these environment variables:

```bash
# Port Configuration
RAPIDTRIAGE_PORT=3025           # Server port (default: 3025)
RAPIDTRIAGE_MCP_PORT=3026       # MCP port (default: 3026)

# Feature Flags
RAPIDTRIAGE_ENABLE_LIGHTHOUSE=true    # Enable Lighthouse audits
RAPIDTRIAGE_ENABLE_SCREENSHOTS=true   # Enable screenshots
RAPIDTRIAGE_ENABLE_CONSOLE=true       # Enable console logging

# Performance
RAPIDTRIAGE_MAX_LOG_SIZE=1000        # Max console logs to store
RAPIDTRIAGE_MAX_NETWORK_LOGS=500     # Max network logs to store

# Debugging
RAPIDTRIAGE_DEBUG=true               # Enable debug logging
```

---

## 🔧 Advanced Configuration

### Custom Server Path
If you've installed globally or have a custom installation:

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "/usr/local/bin/rapidtriage-mcp",
      "args": [],
      "env": {
        "RAPIDTRIAGE_PORT": "3025"
      }
    }
  }
}
```

### Docker Configuration
For containerized environments:

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--network", "host",
        "/-mcp:latest"
      ]
    }
  }
}
```

### Remote Server Configuration
For remote MCP server with SSE transport:

```json
{
  "mcpServers": {
    "rapidtriage": {
      "transport": "sse",
      "url": "https://rapidtriage.me/sse",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  }
}
```

---

## 🐛 Troubleshooting

### Connection Issues
1. Ensure the server is running: `npx @yarlis/rapidtriage-server@latest`
2. Check port availability: `lsof -i :3025`
3. Verify Chrome extension is installed and enabled

### IDE Not Detecting MCP
1. Restart your IDE after configuration
2. Check configuration file path is correct
3. Ensure Node.js is installed: `node --version`

### Permission Errors
```bash
# macOS/Linux: Give execute permissions
chmod +x $(which rapidtriage-mcp)

# Windows: Run as Administrator
```

---

## 📚 IDE-Specific Features

| IDE | Live Preview | Debugging | Multi-file | AI Chat | Collaboration |
|-----|-------------|-----------|------------|---------|---------------|
| Cursor | ✅ | ✅ | ✅ | ✅ | ✅ |
| VS Code + Continue | ✅ | ✅ | ✅ | ✅ | ❌ |
| Zed | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cline | ✅ | ✅ | ✅ | ✅ | ❌ |
| Claude Desktop | ❌ | ❌ | ❌ | ✅ | ❌ |
| Windsurf | ✅ | ✅ | ✅ | ✅ | ✅ |
| JetBrains | ✅ | ✅ | ✅ | ✅ | ❌ |
| Neovim | ❌ | ✅ | ✅ | ✅ | ❌ |
| Sublime Text | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## 🤝 Contributing IDE Support

To add support for a new IDE:

1. Check if the IDE supports MCP or can run external processes
2. Create a configuration following the generic template
3. Test the integration
4. Submit a PR with documentation

---

## 📞 Support

- **Documentation**: https://rapidtriage.me/docs
- **GitHub Issues**: https://github.com/YarlisAISolutions/rapidtriage-mcp/issues
- **Discord**: https://discord.gg/rapidtriage

---

**YarlisAISolutions** - Making browser debugging accessible across all development environments