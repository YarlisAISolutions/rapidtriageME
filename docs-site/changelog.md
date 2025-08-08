# Changelog

All notable changes to RapidTriageME will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Multi-browser support (Firefox, Safari) - in development
- Advanced screenshot annotation tools
- Custom MCP tool development framework
- Real-time collaboration features

### Changed
- Improved error messages with more context
- Enhanced performance monitoring capabilities

## [1.0.0] - 2024-01-01

### Added
- 🎆 **Initial Release** - Complete rebranding to YarlisAISolutions RapidTriageME
- 🤖 **Multi-IDE Support** - Compatible with 10+ IDEs and AI assistants
- 📦 **NPM Packages** - Published `@yarlisai/rapidtriage-mcp` and `@yarlisai/rapidtriage-server`
- 🌍 **Cloud Deployment** - Ready for Cloudflare Workers at rapidtriage.me
- 📸 **Advanced Screenshots** - Full-page and element-specific capture with auto-paste
- 🚀 **Lighthouse Integration** - Complete SEO, performance, accessibility, and best practice audits
- 🔍 **Debugger Mode** - Execute all debugging tools in sequence
- 📊 **Audit Mode** - Run all auditing tools systematically
- 🌐 **Cross-Platform** - Windows, macOS, and Linux support
- 🔗 **Improved Networking** - Auto-discovery, auto-reconnect, graceful shutdown

### Changed
- 🎨 **Complete Rebranding** - From cursor-browser-tools to YarlisAISolutions RapidTriageME
- 📦 **Package Structure** - Reorganized into focused, single-purpose packages
- 📝 **Documentation** - Comprehensive documentation site with MkDocs
- 🔧 **Architecture** - Modular design with clear separation of concerns

### Fixed
- 🔌 **Connection Stability** - Resolved WebSocket disconnection issues
- 💾 **Memory Management** - Fixed memory leaks in long-running sessions
- 🔒 **Security** - Enhanced data sanitization and privacy protection

## [0.9.0] - 2023-12-15

### Added
- **MCP Protocol Support** - Full Model Context Protocol implementation
- **Real-time Data Streaming** - WebSocket-based live updates
- **Performance Audits** - Basic Lighthouse integration
- **Multi-session Support** - Handle multiple browser connections

### Changed
- **Server Architecture** - Moved to Express.js for better performance
- **Error Handling** - Improved error messages and recovery

### Deprecated
- Legacy REST API endpoints (will be removed in v1.1.0)

### Removed
- Old configuration format (replaced with JSON config)

### Fixed
- Chrome extension manifest v3 compatibility
- Screenshot capture on high-DPI displays

### Security
- Added rate limiting to prevent abuse
- Implemented data sanitization for console logs

## [0.8.5] - 2023-11-30

### Fixed
- **Critical**: WebSocket connection timeouts on slow networks
- **Bug**: Screenshot capture failing on pages with CSP headers
- **Bug**: Console logs not capturing async errors properly

### Changed
- Increased WebSocket connection timeout to 30 seconds
- Improved error logging and diagnostics

## [0.8.0] - 2023-11-15

### Added
- **Chrome Extension** - DevTools panel integration
- **Screenshot Capture** - Full-page and viewport screenshots
- **Console Log Monitoring** - Real-time console output capture
- **Network Request Tracking** - HTTP request/response monitoring
- **Basic API** - RESTful endpoints for data access

### Changed
- Project renamed from "browser-debug-tools" to "cursor-browser-tools"
- Improved documentation structure

## [0.7.0] - 2023-10-30

### Added
- Initial Cursor IDE integration
- Basic MCP server implementation
- WebSocket communication protocol

### Fixed
- Node.js compatibility issues on Windows
- Extension loading problems in Chrome

## [0.6.0] - 2023-10-15

### Added
- Prototype Chrome extension
- Basic screenshot functionality
- Simple HTTP server

### Changed
- Migrated from Python to Node.js
- Adopted TypeScript for better type safety

## Migration Guides

### Upgrading from 0.x to 1.0.0

This is a major version with breaking changes. Follow these steps:

#### 1. Update Package Names
```bash
# Remove old packages
npm uninstall -g cursor-browser-tools

# Install new packages
npm install -g @yarlisai/rapidtriage-server @yarlisai/rapidtriage-mcp
```

#### 2. Update IDE Configuration

**Old Cursor configuration:**
```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "npx",
      "args": ["cursor-browser-tools-mcp"]
    }
  }
}
```

**New Cursor configuration:**
```json
{
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

#### 3. Update Chrome Extension

1. Remove the old extension from Chrome
2. Download the new RapidTriage extension
3. Install the new extension following the [installation guide](getting-started/installation.md)

#### 4. Update Scripts and Automation

**Old API calls:**
```bash
curl http://localhost:3000/screenshot
```

**New API calls:**
```bash
curl http://localhost:1421/capture-screenshot
```

#### 5. Configuration File Updates

**Old config format:**
```json
{
  "port": 3000,
  "enableScreenshots": true
}
```

**New config format:**
```json
{
  "server": {
    "port": 1421,
    "host": "localhost"
  },
  "features": {
    "screenshots": {
      "enabled": true,
      "quality": 80
    }
  }
}
```

## Version Support

| Version | Status | Support Until | Notes |
|---------|--------|---------------|-------|
| 1.0.x | **Active** | 2025-01-01 | Current stable release |
| 0.9.x | Maintenance | 2024-06-01 | Security fixes only |
| 0.8.x | End of Life | 2024-03-01 | No longer supported |
| 0.7.x and older | End of Life | 2024-01-01 | No longer supported |

## Release Schedule

- **Major releases** (breaking changes): Every 12 months
- **Minor releases** (new features): Every 4-6 weeks  
- **Patch releases** (bug fixes): As needed
- **Security releases**: Immediate

## Deprecation Policy

- **6 months notice** for breaking changes in major versions
- **3 months notice** for feature deprecations in minor versions
- **Clear migration guides** provided for all breaking changes
- **Parallel support** during transition periods

## Contributing to Changelog

When contributing, please:

1. **Add entries** to the `[Unreleased]` section
2. **Use the correct category**: Added, Changed, Deprecated, Removed, Fixed, Security
3. **Write clear descriptions** of what changed and why
4. **Include issue/PR references** where applicable
5. **Follow the format** established in existing entries

### Changelog Entry Format

```markdown
### Added
- **Feature Name** - Brief description with context [#123](https://github.com/yarlisai/rapidtriage/pull/123)

### Changed
- **Component**: Description of what changed and impact [#456](https://github.com/yarlisai/rapidtriage/issues/456)

### Fixed
- **Critical/Bug**: Description of what was broken and how it was fixed [#789](https://github.com/yarlisai/rapidtriage/issues/789)
```

## Historical Context

RapidTriageME has evolved significantly since its initial release:

### Origins (2023)
Started as a simple browser automation tool for Cursor IDE, focusing on screenshot capture and basic debugging.

### Evolution (Late 2023)
Expanded to support multiple IDEs and added comprehensive browser monitoring capabilities.

### Transformation (2024)
Complete rebranding and architectural overhaul to become a comprehensive AI-powered browser debugging platform.

## Looking Forward

### Planned for 2024
- **Multi-browser support** - Firefox and Safari integration
- **Advanced AI features** - Intelligent error analysis and suggestions
- **Team collaboration** - Shared debugging sessions
- **Enterprise features** - SSO, audit logs, custom deployments

### Long-term Vision
- **Universal browser debugging** - Support all major browsers
- **AI-first debugging** - Intelligent automated problem resolution
- **Developer ecosystem** - Plugin marketplace and custom tools
- **Enterprise scale** - Large organization support

---

**Stay Updated**: Watch our [GitHub repository](https://github.com/yarlisai/rapidtriage) and join our [Discord community](https://discord.gg/rapidtriage) for the latest updates and release announcements.