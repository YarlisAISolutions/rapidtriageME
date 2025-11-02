# RapidTriageME - Quick Start

## ✅ Server is Running!

The local server is now running at: **http://localhost:3025**

## 🔄 Next Steps to Use the Extension

### 1. Reload the Extension

Open this URL in Chrome:
```
chrome://extensions/?id=apmgcakokbocmcnioakggmjhjaiablci
```

Then click the **🔄 reload icon** next to RapidTriage DevTools.

### 2. Open DevTools

1. Navigate to any webpage (e.g., https://example.com)
2. Press **F12** (or **Cmd+Option+I** on Mac)
3. Click the **"RapidTriage"** tab

### 3. Verify Connection

You should see at the top:
```
🟢 Connected to RapidTriageME Browser Tools Server v2.0.0 at localhost:3025
```

If you see 🔴 (red), click the **"Reconnect"** button.

## 📸 Try It Out!

1. Click **"Screenshot 📸"** button
2. Screenshots save to: `~/RapidTriage_Screenshots`
3. Click **"Console Logs"** to view page console output
4. Click **"Performance"** audit to test page performance

## 🛠️ Useful Commands

```bash
# Stop the server
./stop-server.sh

# Restart the server
./stop-server.sh && ./start-server.sh

# Check server status
curl http://localhost:3025/health

# View screenshots folder
open ~/RapidTriage_Screenshots
```

## 🐛 Troubleshooting

**Extension shows "Initializing..." forever:**
- Reload the extension at chrome://extensions/
- Make sure server is running (check terminal)
- Click "Reconnect" button in the panel

**"Not connected to server":**
- Verify server is running: `curl http://localhost:3025/.identity`
- Restart server: `./stop-server.sh && ./start-server.sh`
- Reload extension

**Screenshots not saving:**
- Ensure local server is running (remote can't capture screenshots)
- Check folder exists: `ls ~/RapidTriage_Screenshots`

## 📚 Full Documentation

See **SETUP_GUIDE.md** for complete documentation including:
- Full feature list
- Advanced configuration
- Development workflow
- Troubleshooting guide

---

**Server Status**: ✅ Running on port 3025  
**Extension Version**: 3.2.0  
**Configuration**: Using config.json (no hardcoded values)

