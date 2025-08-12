# RapidTriageME Bruno Collection Guide

## Overview

The RapidTriageME Bruno Collection v2.0 provides comprehensive API testing for all endpoints, including authentication, browser operations, debugging tools, and error handling.

## Collection Structure

### 📁 Folders

1. **Authentication** - User registration, login, profile management
2. **API Keys** - Create, list, and revoke API keys
3. **Browser Operations** - Screenshots, navigation, element inspection
4. **Debugging** - Console logs, network logs, triage reports
5. **System** - Health checks, metrics, CORS
6. **Dashboard** - UI pages and documentation
7. **Documentation** - API docs, OpenAPI specs
8. **Error Handling** - Edge cases and validation
9. **Performance** - Load testing examples
10. **E2E Tests** - Complete workflow tests

## Setup Instructions

### 1. Import Collection

1. Open Bruno
2. Click "Import Collection"
3. Select `RapidTriageME-Bruno-Collection-v2.bru`
4. Choose import location

### 2. Configure Environment Variables

Create a new environment with these variables:

```javascript
{
  "base_url": "https://rapidtriage.me",
  "local_url": "http://localhost:8787",
  "jwt_token": "",
  "api_key": "",
  "user_email": "test@example.com",
  "user_password": "TestPass123!"
}
```

### 3. Authentication Flow

Run tests in this order for initial setup:

1. **01. Authentication - Register** - Creates new user
2. **02. Authentication - Login** - Gets JWT token
3. **05. API Keys - Create Key** - Creates API key for testing

The collection automatically saves tokens for subsequent requests.

## Test Scenarios

### Complete E2E Test Flow

```
1. Register User → 2. Login → 3. Get Profile → 4. Create API Key → 
5. Use API Key → 6. Generate Reports → 7. Revoke Key → 8. Cleanup
```

### Authentication Testing

- ✅ User registration with validation
- ✅ Login with credentials
- ✅ JWT token management
- ✅ Profile updates
- ✅ Token expiration handling

### API Key Management

- ✅ Create keys with permissions
- ✅ List keys with pagination
- ✅ Revoke keys
- ✅ Permission validation

### Browser Operations

- ✅ Screenshot upload
- ✅ Browser navigation
- ✅ Console log retrieval
- ✅ Network log analysis
- ✅ Triage report generation

### Error Handling

- ❌ Invalid credentials (401)
- ❌ Duplicate registration (409)
- ❌ Invalid email format (400)
- ❌ Weak passwords (400)
- ❌ Missing fields (400)
- ❌ Expired tokens (401)
- ❌ Invalid API keys (401)

## Running Tests

### Individual Tests

Click on any request and press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

### Folder Tests

Right-click on a folder → Run All

### Collection Runner

1. Click "Runner" tab
2. Select collection
3. Configure iterations and delay
4. Click "Run Collection"

## Test Assertions

Each test includes assertions for:

- Status codes
- Response structure
- Data validation
- Token/key storage
- Error messages

Example assertion:

```javascript
test("User registered successfully", () => {
  expect(res.status).to.equal(201);
  expect(res.body.success).to.equal(true);
  expect(res.body.token).to.exist;
  
  // Save token for future requests
  env.set("jwt_token", res.body.token);
});
```

## Environment Variables

### Production

```javascript
{
  "base_url": "https://rapidtriage.me"
}
```

### Staging

```javascript
{
  "base_url": "https://staging.rapidtriage.me"
}
```

### Local Development

```javascript
{
  "base_url": "http://localhost:8787"
}
```

## Common Issues

### 1. Authentication Failures

- Ensure user is registered first
- Check token hasn't expired
- Verify credentials are correct

### 2. API Key Issues

- Create key before using
- Check key permissions
- Ensure key isn't revoked

### 3. CORS Errors

- Add Origin header
- Check allowed methods
- Verify credentials included

## Advanced Testing

### Load Testing

Use the collection runner with:
- Iterations: 100
- Delay: 100ms
- Monitor response times

### Security Testing

Test included for:
- SQL injection attempts
- XSS payloads
- Token manipulation
- Rate limiting

### Performance Benchmarks

Expected response times:
- Health check: <50ms
- Authentication: <200ms
- API operations: <500ms
- Report generation: <1000ms

## Integration with CI/CD

### Export for CLI

```bash
# Export collection
bruno export collection -o rapidtriage.json

# Run with Newman
newman run rapidtriage.json -e production.json
```

### GitHub Actions

```yaml
- name: API Tests
  run: |
    npm install -g @usebruno/cli
    bruno run RapidTriageME-Bruno-Collection-v2.bru \
      --env production
```

## Troubleshooting

### Token Expired

Run login request again to refresh token

### Rate Limiting

Wait 60 seconds or use different API key

### Connection Refused

Check if server is running:
```bash
curl https://rapidtriage.me/health
```

## Support

- 📧 Email: support@rapidtriage.me
- 🐛 Issues: https://github.com/YarlisAISolutions/rapidtriageME/issues
- 📚 Docs: https://docs.rapidtriage.me

## Updates

Collection version: 2.0.0
Last updated: August 2025

Check for updates:
https://github.com/YarlisAISolutions/rapidtriageME/blob/main/RapidTriageME-Bruno-Collection-v2.bru