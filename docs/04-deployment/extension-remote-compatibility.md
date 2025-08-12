# Chrome Extension Remote Server Compatibility

## Overview
The RapidTriage Chrome extension has been updated to work seamlessly with both local and remote servers.

## Version 2.4.0 Changes

### 1. Signature Validation Updates
The extension now accepts both server signatures:
- `mcp-browser-connector-24x7` - Local browser tools server (localhost:3025)
- `rapidtriage-remote` - Remote RapidTriage server (rapidtriage.me)

### 2. Files Modified

#### background.js
- `validateServerIdentity()` - Now accepts both local and remote signatures
- Automatically detects protocol (http/https) based on host
- Added remote screenshot fallback functionality

#### panel.js
- Updated server validation to accept both signatures
- Connection status displays correctly for both server types

#### popup.js
- Already had dynamic server detection
- No signature validation changes needed

### 3. Screenshot Functionality

#### Local Server Available
1. Extension validates local server (localhost:3025)
2. Captures screenshot using Chrome API
3. Sends to local server for processing/storage

#### Local Server Not Available (Remote Only)
1. Extension detects local server is offline
2. Captures screenshot using Chrome API
3. Sends directly to remote server (rapidtriage.me)
4. Remote server acknowledges receipt

### 4. API Endpoint Behavior

All API endpoints now work with automatic fallback:

| Feature | Local Server | Remote Server | Notes |
|---------|-------------|---------------|-------|
| Screenshot | Full capture & save | Receive & acknowledge | Remote can store but not capture |
| Console Logs | Mock data | Mock data | Both return simulated logs |
| Network Logs | Mock data | Mock data | Both return simulated network data |
| Lighthouse | Mock audit | Mock audit | Both return simulated audit results |
| Element Inspect | Mock data | Mock data | Both return simulated element data |

### 5. Connection Flow

```
1. User opens DevTools/Popup
   ↓
2. Extension checks current URL
   ↓
3. Determines primary server:
   - localhost/* → Use local server
   - *.rapidtriage.me/* → Use remote server
   - Other → Try local first, then remote
   ↓
4. Validates server with .identity endpoint
   ↓
5. Accepts both signatures as valid
   ↓
6. Establishes connection
```

### 6. Installation & Testing

#### Update Extension
1. Go to `chrome://extensions/`
2. Find "RapidTriage DevTools"
3. Click refresh icon
4. Version should show 2.4.0

#### Test Local Server
1. Start local browser tools server
2. Navigate to any localhost URL
3. Open DevTools → RapidTriage panel
4. All features should work

#### Test Remote Server
1. Navigate to https://test.rapidtriage.me/
2. Open DevTools → RapidTriage panel
3. Connection should show "rapidtriage-remote"
4. Screenshot and other features should work

### 7. Troubleshooting

#### "Not a valid RapidTriage server"
- Server is returning unexpected signature
- Check server is running and accessible
- Verify .identity endpoint returns correct signature

#### Screenshot fails on remote
- Check browser permissions for screenshot capture
- Ensure DevTools is open for the correct tab
- Check console for specific error messages

#### Connection keeps failing
- Clear extension storage: chrome://extensions/ → Details → Clear storage
- Reload extension
- Check network connectivity to server

### 8. Future Improvements

1. **Persistent Storage**: Implement R2/KV storage for screenshots on remote server
2. **Real Data**: Replace mock data with actual browser data collection
3. **WebSocket Support**: Add real-time streaming for logs and events
4. **Authentication**: Add user authentication for remote server access
5. **Data Sync**: Sync captured data between local and remote servers

## Developer Notes

### Adding New Server Types
To add support for additional server types:

1. Add signature to `validSignatures` array in:
   - `background.js` → `validateServerIdentity()`
   - `panel.js` → Two locations where signature is checked

2. Update protocol/port logic if needed in `validateServerIdentity()`

3. Increment version in `manifest.json`

### Server Identity Response Format
Servers must respond to `/.identity` endpoint with:
```json
{
  "name": "Server Name",
  "version": "1.0.0",
  "signature": "unique-server-signature",
  "environment": "production|development",
  "timestamp": "2025-08-11T02:30:00.000Z"
}
```