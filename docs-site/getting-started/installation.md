# Installation Guide

This comprehensive guide will walk you through installing RapidTriageME step-by-step. Choose the installation method that best fits your needs.

## Prerequisites

Before installing RapidTriageME, ensure your system meets these requirements:

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Node.js** | 18.0+ | 20.0+ LTS |
| **RAM** | 4GB | 8GB+ |
| **Disk Space** | 500MB | 1GB+ |
| **Operating System** | macOS 10.15+, Windows 10+, Linux (Ubuntu 18.04+) | Latest versions |

### Required Software

!!! info "Installation Order"
    Install these components in the order listed for the smoothest experience.

1. **Node.js** - JavaScript runtime for the server components
2. **Chrome Browser** - Required for the debugging extension
3. **Git** (optional) - For cloning repositories and development

### Download Node.js

=== "macOS"
    
    ```bash
    # Using Homebrew (recommended)
    brew install node@20
    
    # Or download from official site
    # https://nodejs.org/en/download/
    ```

=== "Windows"
    
    ```powershell
    # Using Chocolatey (recommended)
    choco install nodejs-lts
    
    # Or using Scoop
    scoop install nodejs-lts
    
    # Or download installer from:
    # https://nodejs.org/en/download/
    ```

=== "Linux"
    
    ```bash
    # Ubuntu/Debian
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # CentOS/RHEL/Fedora
    curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
    sudo dnf install nodejs npm
    
    # Arch Linux
    sudo pacman -S nodejs npm
    ```

### Verify Prerequisites

Run these commands to verify your setup:

```bash
# Check Node.js version
node --version
# Should output: v20.x.x or higher

# Check npm version
npm --version
# Should output: 10.x.x or higher

# Check if Chrome is installed
google-chrome --version  # Linux
# OR
chrome --version         # macOS
# Should output Chrome version 90+
```

## Installation Methods

### Method 1: NPM Global Installation (Recommended)

This is the fastest and easiest way to get started with RapidTriageME.

#### Step 1: Install Global Packages

```bash
# Install both packages globally
npm install -g @yarlisai/rapidtriage-server @yarlisai/rapidtriage-mcp

# Or install separately
npm install -g @yarlisai/rapidtriage-server
npm install -g @yarlisai/rapidtriage-mcp
```

#### Step 2: Verify Installation

```bash
# Check if server command is available
rapidtriage-server --version

# Check if MCP server is available
rapidtriage-mcp --version

# Alternative: Use npx (doesn't require global install)
npx @yarlisai/rapidtriage-server --version
npx @yarlisai/rapidtriage-mcp --version
```

### Method 2: Local Development Installation

For developers who want to contribute or customize RapidTriageME.

#### Step 1: Clone Repository

```bash
# Clone the main repository
git clone https://github.com/yarlisai/rapidtriage.git
cd rapidtriage
```

#### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd rapidtriage-server
npm install
npm run build
cd ..

# Install MCP server dependencies
cd rapidtriage-mcp
npm install
npm run build
cd ..
```

#### Step 3: Build All Components

```bash
# Build all components at once
./run.sh build

# Or build individually
cd rapidtriage-server && npm run build && cd ..
cd rapidtriage-mcp && npm run build && cd ..
```

### Method 3: Docker Installation

For containerized deployments and isolated environments.

#### Step 1: Install Docker

Make sure Docker is installed and running on your system:

=== "macOS"
    
    ```bash
    # Install Docker Desktop
    brew install --cask docker
    ```

=== "Windows"
    
    ```powershell
    # Install Docker Desktop
    winget install Docker.DockerDesktop
    ```

=== "Linux"
    
    ```bash
    # Install Docker Engine
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    ```

#### Step 2: Run Docker Container

```bash
# Pull and run the latest image
docker run -d \
  --name rapidtriage \
  -p 1421:1421 \
  -p 8080:8080 \
  yarlisai/rapidtriage:latest

# Check if container is running
docker ps

# View logs
docker logs rapidtriage
```

#### Step 3: Docker Compose (Optional)

For more complex deployments:

```yaml
# docker-compose.yml
version: '3.8'
services:
  rapidtriage:
    image: yarlisai/rapidtriage:latest
    ports:
      - "1421:1421"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

```bash
# Start with Docker Compose
docker-compose up -d
```

## Chrome Extension Installation

The Chrome extension is required for capturing browser data.

### Step 1: Download Extension

Choose your preferred method:

=== "GitHub Releases"
    
    1. Visit [GitHub Releases](https://github.com/yarlisai/rapidtriage/releases/latest)
    2. Download `rapidtriage-extension-v1.0.0.zip`
    3. Extract to a folder (e.g., `~/rapidtriage-extension`)

=== "Clone Repository"
    
    ```bash
    # Clone repository
    git clone https://github.com/yarlisai/rapidtriage.git
    cd rapidtriage/rapidtriage-extension
    
    # Extension files are ready to use
    ```

=== "Direct Download"
    
    ```bash
    # Download and extract
    curl -L https://github.com/yarlisai/rapidtriage/releases/latest/download/rapidtriage-extension.zip -o rapidtriage-extension.zip
    unzip rapidtriage-extension.zip
    ```

### Step 2: Install in Chrome

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" in the top right

3. **Load Extension**
   - Click "Load unpacked"
   - Select the extracted extension folder
   - Click "Select Folder"

4. **Verify Installation**
   - Extension icon should appear in toolbar
   - Click the extension icon to see the popup
   - Should show "RapidTriage Extension v1.0.0"

### Step 3: Pin Extension (Recommended)

1. Click the puzzle piece icon in Chrome toolbar
2. Find "RapidTriage" in the list
3. Click the pin icon to pin it to toolbar

## Environment Configuration

### Setting Up Environment Variables

Create environment configuration for your system:

=== "macOS/Linux"
    
    ```bash
    # Add to ~/.bashrc or ~/.zshrc
    export RAPIDTRIAGE_PORT=1421
    export RAPIDTRIAGE_HOST=localhost
    export NODE_ENV=development
    export LOG_LEVEL=info
    
    # Reload shell configuration
    source ~/.bashrc  # or ~/.zshrc
    ```

=== "Windows (PowerShell)"
    
    ```powershell
    # Set environment variables
    [Environment]::SetEnvironmentVariable("RAPIDTRIAGE_PORT", "1421", "User")
    [Environment]::SetEnvironmentVariable("RAPIDTRIAGE_HOST", "localhost", "User")
    [Environment]::SetEnvironmentVariable("NODE_ENV", "development", "User")
    
    # Restart PowerShell to apply changes
    ```

=== "Windows (Command Prompt)"
    
    ```cmd
    # Set environment variables
    setx RAPIDTRIAGE_PORT 1421
    setx RAPIDTRIAGE_HOST localhost
    setx NODE_ENV development
    
    # Restart Command Prompt to apply changes
    ```

### Configuration File

Create a configuration file for persistent settings:

```bash
# Create config directory
mkdir -p ~/.rapidtriage

# Create config file
cat > ~/.rapidtriage/config.json << EOF
{
  "port": 1421,
  "host": "localhost",
  "logLevel": "info",
  "enableCors": true,
  "enableAuth": false,
  "screenshot": {
    "maxWidth": 1920,
    "maxHeight": 1080,
    "quality": 80
  },
  "lighthouse": {
    "enabled": true,
    "timeout": 30000
  }
}
EOF
```

## IDE Configuration

Configure your preferred IDE to use RapidTriageME:

### Cursor IDE

```json
// ~/.cursor/mcp_settings.json
{
  "mcpServers": {
    "rapidtriage": {
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

### VS Code with Continue

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
        "BROWSER_TOOLS_PORT": "1421"
      }
    }
  }
}
```

### Claude Desktop

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
        "DEBUG": "true"
      }
    }
  }
}
```

## Verification & Testing

### Step 1: Start Services

```bash
# Terminal 1: Start browser connector server
npx @yarlisai/rapidtriage-server

# You should see:
# 🚀 RapidTriage Server running on port 1421
# ✅ WebSocket server ready
# ✅ HTTP server ready
```

### Step 2: Test Browser Extension

1. Open Chrome and navigate to any website
2. Open DevTools (F12 or right-click → Inspect)
3. Look for "RapidTriage" tab in DevTools
4. Click the tab - should show "Connected" status
5. Extension icon should show green dot when connected

### Step 3: Test MCP Integration

Start your IDE (Cursor, VS Code, etc.) and verify MCP connection:

```bash
# Test MCP server directly
npx @yarlisai/rapidtriage-mcp

# Should output available tools:
# Tools: screenshot_capture, get_console_logs, run_lighthouse_audit, etc.
```

### Step 4: End-to-End Test

1. **Open a website** in Chrome with DevTools
2. **Ask your AI assistant**: "Take a screenshot of the current page"
3. **Expected result**: Screenshot should be captured and displayed
4. **Ask**: "Check console logs"
5. **Expected result**: Any console messages should be retrieved

## Troubleshooting Installation

### Common Issues

#### Port Already in Use

```bash
# Check what's using port 1421
lsof -i :1421

# Kill the process if needed
kill -9 <PID>

# Or use a different port
RAPIDTRIAGE_PORT=3030 npx @yarlisai/rapidtriage-server
```

#### Permission Errors (npm global install)

```bash
# Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Or use npx instead of global install
npx @yarlisai/rapidtriage-server
```

#### Chrome Extension Not Loading

1. **Check Developer Mode** - Must be enabled
2. **Reload Extension** - Click reload button in chrome://extensions/
3. **Clear Extension Data** - Remove and re-add the extension
4. **Check Console Errors** - Open chrome://extensions/ and check for errors

#### MCP Server Not Found

```bash
# Check Node.js path
which node

# Check if package is installed
npm list -g @yarlisai/rapidtriage-mcp

# Try absolute path in IDE config
{
  "command": "/usr/local/bin/npx",
  "args": ["@yarlisai/rapidtriage-mcp"]
}
```

### Getting Help

If you encounter issues not covered here:

1. **Check our [troubleshooting guide](../troubleshooting/common-issues.md)**
2. **Search [existing issues](https://github.com/yarlisai/rapidtriage/issues)**
3. **Join our [Discord community](https://discord.gg/rapidtriage)**
4. **Create a [new issue](https://github.com/yarlisai/rapidtriage/issues/new)**

When reporting issues, include:
- Operating system and version
- Node.js version (`node --version`)
- Chrome version
- Installation method used
- Complete error messages
- Steps to reproduce

## Next Steps

Congratulations! You've successfully installed RapidTriageME. Here's what to do next:

1. **[Configure your environment](configuration.md)** - Customize settings and options
2. **[Learn about debugging](../guides/debugging.md)** - Master debugging techniques
3. **[Explore the architecture](../architecture/overview.md)** - Understand how it all works
4. **[Join the community](https://discord.gg/rapidtriage)** - Get help and share experiences

---

**Installation complete!** Your AI assistant can now interact with any website through RapidTriageME.