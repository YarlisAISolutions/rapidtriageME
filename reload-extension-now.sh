#!/bin/bash

# Quick reload instructions for the extension

EXTENSION_ID="apmgcakokbocmcnioakggmjhjaiablci"

cat << 'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Extension Updated to v3.2.1 - Ready to Reload!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Fixed Issues:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Proper DOM initialization (no more "Initializing...")
• Safe event listener setup
• Improved error handling
• Better connection discovery

🔄 How to Reload:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Open Chrome and go to:
   chrome://extensions/?id=apmgcakokbocmcnioakggmjhjaiablci

2. Click the 🔄 RELOAD button

3. Close any open DevTools windows

4. Navigate to ANY webpage (e.g., https://example.com)

5. Open DevTools (F12 or Cmd+Option+I)

6. Click the "RapidTriage" tab

7. You should see: 🟢 Connected to server

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Verify Server is Running:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

# Check server
if curl -s http://localhost:3025/.identity > /dev/null 2>&1; then
    echo "✅ Server is RUNNING on localhost:3025"
    curl -s http://localhost:3025/.identity | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3025/.identity
else
    echo "❌ Server is NOT running!"
    echo ""
    echo "Start the server first:"
    echo "  ./start-server.sh"
fi

cat << 'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐛 If still stuck at "Initializing...":
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Check Chrome DevTools console (F12 → Console tab)
2. Look for [RapidTriage] log messages
3. If you see errors, report them
4. Try clicking "Test Server" button in the panel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

