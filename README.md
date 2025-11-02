# 🚀 RapidTriageME - AI-Powered Browser Debugging Platform

**Complete browser debugging and triage platform** that seamlessly integrates with AI assistants through the Model Context Protocol (MCP).

[![Version](https://img.shields.io/badge/version-3.2.0-blue.svg)](https://github.com/YarlisAISolutions/rapidtriageME)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-rapidtriage.me-orange.svg)](https://docs.rapidtriage.me/)

---

## ✨ Features

- 🔍 **Real-time Browser Monitoring** - Capture console logs, network requests, and errors
- 🤖 **AI Integration** - Seamless integration with Claude, ChatGPT via MCP
- 🌐 **Local & Remote** - Debug locally or access remotely through Firebase
- 📸 **Screenshot Capture** - Visual debugging with automatic screenshot capabilities
- 🚀 **Performance Audits** - Built-in Lighthouse integration
- 🔒 **Secure** - Environment-based configuration, no hardcoded values

## 🎯 Quick Start

### Prerequisites

- Node.js 18+ 
- Chrome Browser
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/YarlisAISolutions/rapidtriageME.git
cd rapidtriageME

# Install dependencies
npm install
cd rapidtriage-server && npm install && cd ..

# Start the local server
./start-server.sh
# Or: npm run server
```

### Install the Extension

1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `rapidtriage-extension` folder
5. Note the extension ID

### Verify It Works

1. Navigate to any webpage
2. Open Chrome DevTools (**F12** or **Cmd+Option+I**)
3. Click the **"RapidTriage"** tab
4. You should see: 🟢 **Connected to RapidTriageME Browser Tools Server**

## 📖 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[Setup Guide](SETUP_GUIDE.md)** - Complete setup and configuration
- **[Online Documentation](https://docs.rapidtriage.me/)** - Full documentation site

## 🏗️ Architecture

```
┌─────────────────┐
│ Chrome Extension│
│   (DevTools)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐     ┌──────────────┐
│  Local Server   │────→│   Firebase   │
│   Port 3025     │     │  Functions   │
└────────┬────────┘     └──────────────┘
         │
         ↓
┌─────────────────┐
│   MCP Server    │
│  (AI Assistant) │
└─────────────────┘
```

## 🎨 Project Structure

```
rapidtriageME/
├── config.json                    # 🔧 Main configuration
├── start-server.sh               # 🚀 Server startup script
├── stop-server.sh                # 🛑 Server stop script
│
├── rapidtriage-extension/        # 🧩 Chrome Extension
│   ├── manifest.json             # Extension manifest
│   ├── config.js                 # Extension configuration
│   ├── background.js             # Service worker
│   ├── devtools.js               # DevTools integration
│   ├── panel.js                  # Main UI logic
│   └── panel.html                # UI layout
│
├── rapidtriage-server/           # 💻 Local Server
│   ├── server.js                 # Express server
│   ├── config.js                 # Config loader
│   └── package.json              # Dependencies
│
└── functions/                    # ☁️ Firebase Cloud Functions
    └── src/
        └── index.ts              # Cloud functions entry
```

## ⚙️ Configuration

The project uses **environment-based configuration** with no hardcoded values:

### Main Configuration (`config.json`)

```json
{
  "server": {
    "host": "localhost",
    "port": 3025,
    "name": "RapidTriageME Browser Tools Server",
    "version": "2.0.0"
  },
  "browser": {
    "headless": true
  },
  "screenshots": {
    "directory": "~/RapidTriage_Screenshots"
  },
  "firebase": {
    "projectId": "yarlis-rapidtriage"
  }
}
```

### Server Environment Variables

Create `.env` in `rapidtriage-server/`:

```bash
PORT=3025
SERVER_NAME=RapidTriageME Browser Tools Server
NODE_ENV=development
```

## 🔧 Available Scripts

### Development

```bash
# Start local server
npm run server
./start-server.sh

# Stop server
npm run server:stop
./stop-server.sh

# Start with dev/watch mode
npm run server:dev
```

### Firebase Deployment

```bash
# Deploy to Firebase
npm run deploy

# Deploy to production
npm run deploy:production

# Run local emulators
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:extension
npm run test:api
npm run test:browser
```

## 🌐 Deployment

### Local Development
- Server runs on `localhost:3025`
- Extension connects automatically
- Screenshots saved to `~/RapidTriage_Screenshots`

### Firebase Production
- Deployed to Firebase Functions
- Hosting on Firebase Hosting
- Firestore for data storage

## 🐛 Troubleshooting

### Extension Not Connecting

```bash
# 1. Check server is running
curl http://localhost:3025/.identity

# 2. Verify port is not blocked
lsof -i :3025

# 3. Restart everything
./stop-server.sh
./start-server.sh
# Then reload extension at chrome://extensions/
```

### Server Won't Start

```bash
# Check for port conflicts
lsof -i :3025 | grep LISTEN

# Kill conflicting process
lsof -ti:3025 | xargs kill -9

# Reinstall dependencies
cd rapidtriage-server
rm -rf node_modules
npm install
```

## 📸 Screenshots

Screenshots are automatically saved to:
- **Default**: `~/RapidTriage_Screenshots/`
- **Custom**: Set in `config.json` → `screenshots.directory`

## 🔗 Useful Links

- **Documentation**: https://docs.rapidtriage.me/
- **GitHub**: https://github.com/YarlisAISolutions/rapidtriageME
- **Server Health**: http://localhost:3025/health
- **Extension**: chrome://extensions/?id=apmgcakokbocmcnioakggmjhjaiablci

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/contributing.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by [YarlisAISolutions](https://yarlis.com)
- Powered by [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- Uses [Puppeteer](https://pptr.dev/) for browser automation
- Deployed on [Firebase](https://firebase.google.com/)

---

**Version**: 3.2.0  
**Last Updated**: November 2, 2025  
**Status**: ✅ Production Ready

For support, please open an issue on GitHub or visit our documentation at https://docs.rapidtriage.me/

