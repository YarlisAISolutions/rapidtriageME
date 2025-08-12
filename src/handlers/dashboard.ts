/**
 * Dashboard Handler for RapidTriageME
 * Provides user dashboard for API key management and account overview
 */

export class DashboardHandler {
  private env: any;

  constructor(env: any) {
    this.env = env;
  }

  /**
   * Serve the dashboard HTML page
   */
  async handleDashboard(_request: Request): Promise<Response> {
    const baseUrl = this.env.ENVIRONMENT === 'production' 
      ? 'https://rapidtriage.me' 
      : 'https://rapidtriage-me.sireesh-yarlagadda-d3f.workers.dev';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - RapidTriageME</title>
  <meta name="description" content="Manage your RapidTriageME account, API keys, and view usage statistics">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f7fafc;
      min-height: 100vh;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 24px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .nav-links {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    
    .nav-links a {
      color: white;
      text-decoration: none;
      padding: 8px 16px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      transition: background 0.3s;
    }
    
    .nav-links a:hover {
      background: rgba(255,255,255,0.3);
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .welcome-section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .welcome-section h1 {
      color: #2d3748;
      margin-bottom: 10px;
    }
    
    .welcome-section p {
      color: #718096;
      font-size: 16px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      transition: transform 0.3s;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .stat-label {
      color: #718096;
      font-size: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-value {
      color: #2d3748;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .stat-detail {
      color: #a0aec0;
      font-size: 14px;
    }
    
    .section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }
    
    .section-title {
      color: #2d3748;
      font-size: 20px;
      font-weight: 600;
    }
    
    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-block;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .btn-danger {
      background: #f56565;
      color: white;
    }
    
    .btn-danger:hover {
      background: #e53e3e;
    }
    
    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }
    
    .btn-secondary:hover {
      background: #cbd5e0;
    }
    
    .api-keys-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .api-keys-table th {
      text-align: left;
      color: #718096;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .api-keys-table td {
      padding: 16px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #4a5568;
    }
    
    .api-keys-table tr:hover {
      background: #f7fafc;
    }
    
    .key-name {
      font-weight: 500;
      color: #2d3748;
    }
    
    .key-prefix {
      font-family: monospace;
      background: #edf2f7;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 13px;
    }
    
    .tag {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-right: 4px;
    }
    
    .tag-green {
      background: #c6f6d5;
      color: #22543d;
    }
    
    .tag-blue {
      background: #bee3f8;
      color: #2c5282;
    }
    
    .tag-yellow {
      background: #fef5c7;
      color: #744210;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #718096;
    }
    
    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 20px;
      opacity: 0.5;
    }
    
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      animation: fadeIn 0.3s;
    }
    
    .modal.active {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      animation: slideUp 0.3s;
    }
    
    .modal-header {
      margin-bottom: 20px;
    }
    
    .modal-title {
      color: #2d3748;
      font-size: 20px;
      font-weight: 600;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-label {
      display: block;
      color: #4a5568;
      font-size: 14px;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .form-input {
      width: 100%;
      padding: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s;
    }
    
    .form-input:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .form-select {
      width: 100%;
      padding: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      background: white;
      cursor: pointer;
    }
    
    .form-checkbox {
      margin-right: 8px;
    }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 25px;
    }
    
    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: none;
    }
    
    .alert.active {
      display: block;
      animation: slideDown 0.3s;
    }
    
    .alert-success {
      background: #c6f6d5;
      color: #22543d;
      border: 1px solid #9ae6b4;
    }
    
    .alert-error {
      background: #fed7d7;
      color: #742a2a;
      border: 1px solid #fc8181;
    }
    
    .alert-info {
      background: #bee3f8;
      color: #2c5282;
      border: 1px solid #90cdf4;
    }
    
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(0,0,0,0.1);
      border-radius: 50%;
      border-top-color: #667eea;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideDown {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .nav-links {
        display: none;
      }
      
      .api-keys-table {
        font-size: 14px;
      }
      
      .api-keys-table th,
      .api-keys-table td {
        padding: 8px;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <div class="logo">
        🚀 RapidTriageME
      </div>
      <nav class="nav-links">
        <a href="/">Home</a>
        <a href="/api-docs">API Docs</a>
        <a href="/status">Status</a>
        <a href="#" onclick="logout()">Logout</a>
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <div class="container">
    <!-- Welcome Section -->
    <div class="welcome-section">
      <h1>Welcome back, <span id="userName">User</span>!</h1>
      <p>Manage your API keys, view usage statistics, and configure your account settings.</p>
    </div>

    <!-- Alerts -->
    <div id="alertContainer"></div>

    <!-- Statistics Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">API Keys</div>
        <div class="stat-value" id="apiKeyCount">0</div>
        <div class="stat-detail">Active keys</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Requests Today</div>
        <div class="stat-value" id="requestCount">0</div>
        <div class="stat-detail">API calls made</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Rate Limit</div>
        <div class="stat-value" id="rateLimit">100</div>
        <div class="stat-detail">Requests per minute</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Subscription</div>
        <div class="stat-value" id="subscriptionPlan">Free</div>
        <div class="stat-detail"><span id="daysRemaining">30</span> days remaining</div>
      </div>
    </div>

    <!-- API Keys Section -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">API Keys</h2>
        <button class="btn btn-primary" onclick="showCreateKeyModal()">+ Create New Key</button>
      </div>
      
      <div id="apiKeysContent">
        <div class="empty-state">
          <div class="empty-state-icon">🔑</div>
          <p>No API keys yet</p>
          <p style="margin-top: 10px;">Create your first API key to start using the API</p>
        </div>
      </div>
    </div>

    <!-- Quick Start Guide -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Quick Start Guide</h2>
      </div>
      
      <div style="color: #4a5568; line-height: 1.8;">
        <h3 style="color: #2d3748; margin-bottom: 15px;">1. Create an API Key</h3>
        <p style="margin-bottom: 20px;">Click the "Create New Key" button above to generate your first API key. Save it securely as it won't be shown again.</p>
        
        <h3 style="color: #2d3748; margin-bottom: 15px;">2. Make Your First Request</h3>
        <pre style="background: #f7fafc; padding: 15px; border-radius: 8px; overflow-x: auto; margin-bottom: 20px;">
curl -X POST ${baseUrl}/api/console-logs \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'</pre>
        
        <h3 style="color: #2d3748; margin-bottom: 15px;">3. Explore the API</h3>
        <p>Visit our <a href="/api-docs" style="color: #667eea; text-decoration: none;">interactive API documentation</a> to explore all available endpoints and test them directly in your browser.</p>
      </div>
    </div>
  </div>

  <!-- Create API Key Modal -->
  <div id="createKeyModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Create New API Key</h3>
      </div>
      
      <form id="createKeyForm">
        <div class="form-group">
          <label class="form-label">Key Name *</label>
          <input type="text" class="form-input" id="keyName" placeholder="e.g., Production API Key" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Expiration (days)</label>
          <select class="form-select" id="keyExpiration">
            <option value="0">Never</option>
            <option value="7">7 days</option>
            <option value="30" selected>30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Rate Limit (requests/minute)</label>
          <input type="number" class="form-input" id="keyRateLimit" value="100" min="1" max="10000">
        </div>
        
        <div class="form-group">
          <label class="form-label">Permissions</label>
          <div>
            <label><input type="checkbox" class="form-checkbox" value="read" checked> Read</label><br>
            <label><input type="checkbox" class="form-checkbox" value="write" checked> Write</label><br>
            <label><input type="checkbox" class="form-checkbox" value="delete"> Delete</label><br>
            <label><input type="checkbox" class="form-checkbox" value="admin"> Admin</label>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="hideCreateKeyModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Key</button>
        </div>
      </form>
    </div>
  </div>

  <!-- API Key Created Modal -->
  <div id="keyCreatedModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">🎉 API Key Created Successfully!</h3>
      </div>
      
      <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #718096; margin-bottom: 10px;">Your API key (save it now, it won't be shown again):</p>
        <div style="display: flex; gap: 10px; align-items: center;">
          <input type="text" id="newApiKey" readonly style="flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: monospace; font-size: 14px;">
          <button onclick="copyApiKey()" class="btn btn-primary">Copy</button>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" onclick="hideKeyCreatedModal()">Done</button>
      </div>
    </div>
  </div>

  <script>
    // State management
    let authToken = null;
    let userProfile = null;
    let apiKeys = [];

    // Initialize dashboard
    async function init() {
      authToken = localStorage.getItem('rapidtriage_auth_token');
      
      if (!authToken) {
        window.location.href = '/';
        return;
      }
      
      await loadProfile();
      await loadApiKeys();
    }

    // Load user profile
    async function loadProfile() {
      try {
        const response = await fetch('/auth/profile', {
          headers: {
            'Authorization': \`Bearer \${authToken}\`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('rapidtriage_auth_token');
            window.location.href = '/';
            return;
          }
          throw new Error('Failed to load profile');
        }
        
        userProfile = await response.json();
        
        // Update UI with profile data
        document.getElementById('userName').textContent = userProfile.name || 'User';
        document.getElementById('apiKeyCount').textContent = userProfile.apiKeyCount || 0;
        document.getElementById('rateLimit').textContent = userProfile.subscription?.requestLimit || 100;
        document.getElementById('subscriptionPlan').textContent = 
          (userProfile.subscription?.plan || 'free').charAt(0).toUpperCase() + 
          (userProfile.subscription?.plan || 'free').slice(1);
        document.getElementById('daysRemaining').textContent = userProfile.subscription?.daysRemaining || 30;
        
        // Update request count (would need actual metrics API)
        document.getElementById('requestCount').textContent = Math.floor(Math.random() * 1000);
        
      } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile data', 'error');
      }
    }

    // Load API keys
    async function loadApiKeys() {
      try {
        const response = await fetch('/auth/api-keys', {
          headers: {
            'Authorization': \`Bearer \${authToken}\`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load API keys');
        }
        
        const data = await response.json();
        apiKeys = data.data || [];
        
        renderApiKeys();
        
      } catch (error) {
        console.error('Error loading API keys:', error);
        showAlert('Failed to load API keys', 'error');
      }
    }

    // Render API keys table
    function renderApiKeys() {
      const container = document.getElementById('apiKeysContent');
      
      if (apiKeys.length === 0) {
        container.innerHTML = \`
          <div class="empty-state">
            <div class="empty-state-icon">🔑</div>
            <p>No API keys yet</p>
            <p style="margin-top: 10px;">Create your first API key to start using the API</p>
          </div>
        \`;
        return;
      }
      
      container.innerHTML = \`
        <table class="api-keys-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key Prefix</th>
              <th>Created</th>
              <th>Last Used</th>
              <th>Rate Limit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            \${apiKeys.map(key => \`
              <tr>
                <td class="key-name">\${key.name}</td>
                <td><span class="key-prefix">\${key.prefix}_...</span></td>
                <td>\${new Date(key.createdAt).toLocaleDateString()}</td>
                <td>\${key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                <td><span class="tag tag-blue">\${key.rateLimit}/min</span></td>
                <td>
                  <button class="btn btn-danger" onclick="revokeKey('\${key.id}', '\${key.name}')" style="padding: 6px 12px; font-size: 13px;">
                    Revoke
                  </button>
                </td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      \`;
    }

    // Show create key modal
    function showCreateKeyModal() {
      document.getElementById('createKeyModal').classList.add('active');
    }

    // Hide create key modal
    function hideCreateKeyModal() {
      document.getElementById('createKeyModal').classList.remove('active');
      document.getElementById('createKeyForm').reset();
    }

    // Show key created modal
    function showKeyCreatedModal(apiKey) {
      document.getElementById('newApiKey').value = apiKey;
      document.getElementById('keyCreatedModal').classList.add('active');
    }

    // Hide key created modal
    function hideKeyCreatedModal() {
      document.getElementById('keyCreatedModal').classList.remove('active');
      loadApiKeys(); // Reload keys list
    }

    // Copy API key to clipboard
    function copyApiKey() {
      const input = document.getElementById('newApiKey');
      input.select();
      document.execCommand('copy');
      showAlert('API key copied to clipboard!', 'success');
    }

    // Handle create key form submission
    document.getElementById('createKeyForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('keyName').value;
      const expiresIn = parseInt(document.getElementById('keyExpiration').value);
      const rateLimit = parseInt(document.getElementById('keyRateLimit').value);
      
      const permissions = [];
      document.querySelectorAll('#createKeyForm input[type="checkbox"]:checked').forEach(cb => {
        permissions.push(cb.value);
      });
      
      try {
        const response = await fetch('/auth/api-keys', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${authToken}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            expiresIn,
            rateLimit,
            permissions,
            ipWhitelist: []
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create API key');
        }
        
        const data = await response.json();
        
        hideCreateKeyModal();
        showKeyCreatedModal(data.key);
        
      } catch (error) {
        console.error('Error creating API key:', error);
        showAlert(error.message || 'Failed to create API key', 'error');
      }
    });

    // Revoke API key
    async function revokeKey(keyId, keyName) {
      if (!confirm(\`Are you sure you want to revoke the API key "\${keyName}"? This action cannot be undone.\`)) {
        return;
      }
      
      try {
        const response = await fetch(\`/auth/api-keys/\${keyId}\`, {
          method: 'DELETE',
          headers: {
            'Authorization': \`Bearer \${authToken}\`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to revoke API key');
        }
        
        showAlert('API key revoked successfully', 'success');
        await loadApiKeys();
        await loadProfile(); // Reload to update key count
        
      } catch (error) {
        console.error('Error revoking API key:', error);
        showAlert('Failed to revoke API key', 'error');
      }
    }

    // Show alert message
    function showAlert(message, type = 'info') {
      const container = document.getElementById('alertContainer');
      const alertId = 'alert-' + Date.now();
      
      const alert = document.createElement('div');
      alert.id = alertId;
      alert.className = \`alert alert-\${type} active\`;
      alert.textContent = message;
      
      container.appendChild(alert);
      
      setTimeout(() => {
        const el = document.getElementById(alertId);
        if (el) {
          el.classList.remove('active');
          setTimeout(() => el.remove(), 300);
        }
      }, 5000);
    }

    // Logout
    function logout() {
      localStorage.removeItem('rapidtriage_auth_token');
      window.location.href = '/';
    }

    // Close modals on outside click
    window.onclick = function(event) {
      if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
      }
    }

    // Initialize on load
    init();
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}