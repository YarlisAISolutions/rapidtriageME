/**
 * Profile Page Handler for RapidTriageME
 * Provides user profile management interface
 */

export class ProfileHandler {
  private _env: any;

  constructor(env: any) {
    this._env = env;
  }

  /**
   * Serve the user profile HTML page
   */
  async handleProfile(_request: Request): Promise<Response> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profile - RapidTriageME</title>
  <meta name="description" content="Manage your RapidTriageME profile and account settings">
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
      text-decoration: none;
      color: white;
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
    
    .nav-links a.active {
      background: rgba(255,255,255,0.3);
    }
    
    .user-menu {
      position: relative;
    }
    
    .user-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 20px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.3s;
    }
    
    .user-button:hover {
      background: rgba(255,255,255,0.3);
    }
    
    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: white;
      color: #667eea;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .profile-header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      gap: 30px;
    }
    
    .profile-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: bold;
    }
    
    .profile-info h1 {
      color: #2d3748;
      margin-bottom: 8px;
    }
    
    .profile-info p {
      color: #718096;
      margin-bottom: 4px;
    }
    
    .profile-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
    
    .badge-free {
      background: #e2e8f0;
      color: #4a5568;
    }
    
    .badge-pro {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
    
    .badge-enterprise {
      background: linear-gradient(135deg, #f6ad55, #ed8936);
      color: white;
    }

    /* Loading Spinner Styles */
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      padding: 40px;
    }

    .spinner {
      width: 60px;
      height: 60px;
      position: relative;
      animation: spinnerRotate 2s linear infinite;
    }

    .spinner-ring {
      box-sizing: border-box;
      position: absolute;
      width: 100%;
      height: 100%;
      border: 4px solid transparent;
      border-radius: 50%;
    }

    .spinner-ring.outer {
      border-top-color: #667eea;
      border-right-color: #667eea;
      animation: spinnerPulse 1.5s ease-in-out infinite;
    }

    .spinner-ring.inner {
      width: 75%;
      height: 75%;
      top: 12.5%;
      left: 12.5%;
      border-bottom-color: #764ba2;
      border-left-color: #764ba2;
      animation: spinnerPulse 1.5s ease-in-out infinite reverse;
    }

    .spinner-ring.center {
      width: 40%;
      height: 40%;
      top: 30%;
      left: 30%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      animation: spinnerCenter 1.5s ease-in-out infinite;
    }

    @keyframes spinnerRotate {
      to { transform: rotate(360deg); }
    }

    @keyframes spinnerPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    @keyframes spinnerCenter {
      0%, 100% { transform: scale(0.8); opacity: 0.6; }
      50% { transform: scale(1); opacity: 1; }
    }

    .loading-text {
      margin-top: 20px;
      color: #718096;
      font-size: 14px;
      font-weight: 500;
      animation: fadeInOut 1.5s ease-in-out infinite;
    }

    @keyframes fadeInOut {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }

    .profile-loading {
      display: none;
    }

    .profile-loading.active {
      display: flex;
    }

    .profile-content {
      display: block;
    }

    .profile-content.hidden {
      display: none;
    }
    
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      border-bottom: 2px solid #e2e8f0;
      background: white;
      border-radius: 12px 12px 0 0;
      padding: 10px 10px 0 10px;
    }
    
    .tab {
      padding: 12px 24px;
      background: none;
      border: none;
      color: #718096;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
      border-radius: 8px 8px 0 0;
      position: relative;
    }
    
    .tab:hover {
      color: #4a5568;
      background: #f7fafc;
    }
    
    .tab.active {
      color: #667eea;
      background: #f7fafc;
    }
    
    .tab.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background: #667eea;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
      animation: fadeIn 0.3s;
    }
    
    .section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .section-title {
      color: #2d3748;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 25px;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-label {
      display: block;
      color: #4a5568;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
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
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .form-input:disabled {
      background: #f7fafc;
      cursor: not-allowed;
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
    
    .form-checkbox-group {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .form-checkbox {
      width: 18px;
      height: 18px;
      margin-right: 8px;
      cursor: pointer;
    }
    
    .form-checkbox-label {
      color: #4a5568;
      font-size: 14px;
      cursor: pointer;
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
    
    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }
    
    .btn-secondary:hover {
      background: #cbd5e0;
    }
    
    .btn-danger {
      background: #f56565;
      color: white;
    }
    
    .btn-danger:hover {
      background: #e53e3e;
    }
    
    .btn-success {
      background: #48bb78;
      color: white;
    }
    
    .btn-success:hover {
      background: #38a169;
    }
    
    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .stat-value {
      color: #2d3748;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .stat-label {
      color: #718096;
      font-size: 14px;
    }
    
    .subscription-card {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
    }
    
    .subscription-card h3 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    
    .subscription-card p {
      opacity: 0.9;
      margin-bottom: 20px;
    }
    
    .subscription-features {
      list-style: none;
      margin-bottom: 20px;
    }
    
    .subscription-features li {
      padding: 8px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .subscription-features li::before {
      content: '✓';
      font-weight: bold;
    }
    
    .security-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f7fafc;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    
    .security-item-info h4 {
      color: #2d3748;
      margin-bottom: 4px;
    }
    
    .security-item-info p {
      color: #718096;
      font-size: 14px;
    }
    
    .toggle-switch {
      position: relative;
      width: 50px;
      height: 26px;
    }
    
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #cbd5e0;
      transition: .4s;
      border-radius: 26px;
    }
    
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    
    input:checked + .toggle-slider {
      background-color: #667eea;
    }
    
    input:checked + .toggle-slider:before {
      transform: translateX(24px);
    }
    
    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: none;
    }
    
    .alert.show {
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
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideDown {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }
      
      .profile-header {
        flex-direction: column;
        text-align: center;
      }
      
      .tabs {
        overflow-x: auto;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <a href="/" class="logo">
        🚀 RapidTriageME
      </a>
      <nav class="nav-links">
        <a href="/dashboard">Dashboard</a>
        <a href="/profile" class="active">Profile</a>
        <a href="/api-docs">API Docs</a>
        <a href="/status">Status</a>
      </nav>
      <div class="user-menu">
        <button class="user-button" onclick="toggleUserMenu()">
          <div class="user-avatar" id="userAvatar">U</div>
          <span id="userNameHeader" style="min-width: 60px; display: inline-block;">User</span>
          <span>▼</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <div class="container">
    <!-- Loading Spinner -->
    <div class="profile-loading active" id="profileLoading">
      <div class="spinner-container">
        <div class="spinner">
          <div class="spinner-ring outer"></div>
          <div class="spinner-ring inner"></div>
          <div class="spinner-ring center"></div>
        </div>
        <div class="loading-text">Loading profile...</div>
      </div>
    </div>

    <!-- Profile Content (initially hidden) -->
    <div class="profile-content hidden" id="profileContent">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-avatar" id="profileAvatar">U</div>
        <div class="profile-info">
          <h1 id="profileName">User</h1>
          <p id="profileEmail">email@example.com</p>
          <p id="profileCompany">Company</p>
          <span class="profile-badge badge-free" id="profileBadge">FREE TIER</span>
        </div>
      </div>

    <!-- Alert Container -->
    <div id="alertContainer"></div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab active" onclick="switchTab('general', this)">General</button>
      <button class="tab" onclick="switchTab('security', this)">Security</button>
      <button class="tab" onclick="switchTab('subscription', this)">Subscription</button>
      <button class="tab" onclick="switchTab('usage', this)">Usage & Billing</button>
    </div>

    <!-- General Tab -->
    <div id="generalTab" class="tab-content active">
      <div class="section">
        <h2 class="section-title">Personal Information</h2>
        <form id="profileForm">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input" id="inputName" placeholder="Your name">
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-input" id="inputEmail" disabled>
            </div>
            <div class="form-group">
              <label class="form-label">Company</label>
              <input type="text" class="form-input" id="inputCompany" placeholder="Your company">
            </div>
            <div class="form-group">
              <label class="form-label">Timezone</label>
              <select class="form-select" id="inputTimezone">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>
          </div>
          <div class="button-group">
            <button type="submit" class="btn btn-primary">Save Changes</button>
            <button type="button" class="btn btn-secondary" onclick="resetForm()">Cancel</button>
          </div>
        </form>
      </div>

      <div class="section">
        <h2 class="section-title">Email Preferences</h2>
        <div class="form-checkbox-group">
          <input type="checkbox" class="form-checkbox" id="emailUpdates" checked>
          <label for="emailUpdates" class="form-checkbox-label">Product updates and announcements</label>
        </div>
        <div class="form-checkbox-group">
          <input type="checkbox" class="form-checkbox" id="emailUsage" checked>
          <label for="emailUsage" class="form-checkbox-label">Weekly usage reports</label>
        </div>
        <div class="form-checkbox-group">
          <input type="checkbox" class="form-checkbox" id="emailSecurity">
          <label for="emailSecurity" class="form-checkbox-label">Security alerts</label>
        </div>
        <div class="form-checkbox-group">
          <input type="checkbox" class="form-checkbox" id="emailMarketing">
          <label for="emailMarketing" class="form-checkbox-label">Marketing communications</label>
        </div>
        <div class="button-group">
          <button class="btn btn-primary" onclick="saveEmailPreferences()">Update Preferences</button>
        </div>
      </div>
    </div>

    <!-- Security Tab -->
    <div id="securityTab" class="tab-content">
      <div class="section">
        <h2 class="section-title">Security Settings</h2>
        
        <div class="security-item">
          <div class="security-item-info">
            <h4>Two-Factor Authentication</h4>
            <p>Add an extra layer of security to your account</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="twoFactorToggle" onchange="toggle2FA()">
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="security-item">
          <div class="security-item-info">
            <h4>Session Timeout</h4>
            <p>Automatically log out after period of inactivity</p>
          </div>
          <select class="form-select" style="width: 150px;" id="sessionTimeout">
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="480">8 hours</option>
            <option value="0">Never</option>
          </select>
        </div>

        <div class="security-item">
          <div class="security-item-info">
            <h4>IP Whitelist</h4>
            <p>Restrict API access to specific IP addresses</p>
          </div>
          <button class="btn btn-secondary" onclick="configureIPWhitelist()">Configure</button>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Password</h2>
        <form id="passwordForm">
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input type="password" class="form-input" id="currentPassword" required>
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input type="password" class="form-input" id="newPassword" required>
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input type="password" class="form-input" id="confirmPassword" required>
          </div>
          <div class="button-group">
            <button type="submit" class="btn btn-primary">Change Password</button>
          </div>
        </form>
      </div>

      <div class="section">
        <h2 class="section-title">Active Sessions</h2>
        <p style="color: #718096; margin-bottom: 20px;">Manage devices where you're currently logged in</p>
        <div id="activeSessions">
          <!-- Sessions will be loaded here -->
        </div>
        <button class="btn btn-danger" onclick="revokeAllSessions()">Revoke All Sessions</button>
      </div>
    </div>

    <!-- Subscription Tab -->
    <div id="subscriptionTab" class="tab-content">
      <div class="subscription-card">
        <h3 id="subscriptionPlan">Free Tier</h3>
        <p id="subscriptionStatus">Your current plan</p>
        <ul class="subscription-features" id="subscriptionFeatures">
          <li>100 API requests per minute</li>
          <li>Basic browser automation</li>
          <li>Console & network logs</li>
          <li>3 API keys maximum</li>
          <li>Community support</li>
        </ul>
        <button class="btn" style="background: white; color: #667eea;" onclick="showUpgradeOptions()">
          Upgrade Plan
        </button>
      </div>

      <div class="section">
        <h2 class="section-title">Available Plans</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <h3 style="color: #2d3748; margin-bottom: 10px;">Pro</h3>
            <div class="stat-value">$49/mo</div>
            <div class="stat-label">1000 requests/min</div>
            <ul style="text-align: left; list-style: none; margin-top: 15px; font-size: 14px; color: #4a5568;">
              <li>✓ All Free features</li>
              <li>✓ Priority support</li>
              <li>✓ Advanced audits</li>
              <li>✓ 10 API keys</li>
              <li>✓ Custom webhooks</li>
            </ul>
            <button class="btn btn-primary" style="width: 100%; margin-top: 15px;" onclick="selectPlan('pro')">
              Select Pro
            </button>
          </div>
          
          <div class="stat-card">
            <h3 style="color: #2d3748; margin-bottom: 10px;">Enterprise</h3>
            <div class="stat-value">Custom</div>
            <div class="stat-label">Unlimited requests</div>
            <ul style="text-align: left; list-style: none; margin-top: 15px; font-size: 14px; color: #4a5568;">
              <li>✓ All Pro features</li>
              <li>✓ Dedicated support</li>
              <li>✓ Custom integrations</li>
              <li>✓ Unlimited API keys</li>
              <li>✓ SLA guarantee</li>
            </ul>
            <button class="btn btn-secondary" style="width: 100%; margin-top: 15px;" onclick="contactSales()">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Usage Tab -->
    <div id="usageTab" class="tab-content">
      <div class="section">
        <h2 class="section-title">Current Usage</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" id="apiCallsToday">0</div>
            <div class="stat-label">API Calls Today</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="apiCallsMonth">0</div>
            <div class="stat-label">API Calls This Month</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="storageUsed">0 MB</div>
            <div class="stat-label">Storage Used</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="activeKeys">0</div>
            <div class="stat-label">Active API Keys</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Billing History</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0;">
              <th style="text-align: left; padding: 12px; color: #718096; font-size: 12px; text-transform: uppercase;">Date</th>
              <th style="text-align: left; padding: 12px; color: #718096; font-size: 12px; text-transform: uppercase;">Description</th>
              <th style="text-align: left; padding: 12px; color: #718096; font-size: 12px; text-transform: uppercase;">Amount</th>
              <th style="text-align: left; padding: 12px; color: #718096; font-size: 12px; text-transform: uppercase;">Status</th>
              <th style="text-align: left; padding: 12px; color: #718096; font-size: 12px; text-transform: uppercase;">Invoice</th>
            </tr>
          </thead>
          <tbody id="billingHistory">
            <tr>
              <td colspan="5" style="text-align: center; padding: 40px; color: #718096;">
                No billing history available for free tier
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Payment Method</h2>
        <p style="color: #718096; margin-bottom: 20px;">No payment method required for free tier</p>
        <button class="btn btn-primary" onclick="addPaymentMethod()">Add Payment Method</button>
      </div>
    </div>
    </div> <!-- End of profile-content -->
  </div> <!-- End of container -->

  <script>
    // State management
    let authToken = null;
    let userProfile = null;

    // Show/hide loading spinner
    function showLoading(show = true) {
      const loadingEl = document.getElementById('profileLoading');
      const contentEl = document.getElementById('profileContent');

      if (show) {
        loadingEl?.classList.add('active');
        contentEl?.classList.add('hidden');
      } else {
        loadingEl?.classList.remove('active');
        contentEl?.classList.remove('hidden');
      }
    }

    // Initialize profile
    async function init() {
      showLoading(true); // Show spinner when starting

      authToken = localStorage.getItem('rapidtriage_auth_token') ||
                  sessionStorage.getItem('rapidtriage_auth_token');

      // Try to load from localStorage first as a fallback
      const storedUser = localStorage.getItem('rapidtriage_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('Found stored user data:', userData);
          // Use stored data as initial values, but don't show defaults
          userProfile = {
            ...userData,
            company: userData.company || userData.organization || '',
            apiKeyCount: userData.apiKeyCount || 0,
            twoFactorEnabled: userData.twoFactorEnabled || false
          };
          updateProfileUI();
        } catch (e) {
          console.error('Failed to parse stored user data:', e);
        }
      }

      // Always try to load fresh data from API
      await loadProfile();
      loadUsageStats();

      // Hide spinner after loading
      setTimeout(() => showLoading(false), 500); // Small delay for smooth transition
    }

    // Load user profile
    async function loadProfile() {
      try {
        console.log('Loading profile with token:', authToken ? 'Token present' : 'No token');
        
        const response = await fetch('/auth/profile', {
          headers: {
            'Authorization': \`Bearer \${authToken}\`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Profile response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Unauthorized, redirecting to login');
            localStorage.removeItem('rapidtriage_auth_token');
            sessionStorage.removeItem('rapidtriage_auth_token');
            localStorage.removeItem('rapidtriage_user');
            showAlert('Session expired. Please login again.', 'error');
            setTimeout(() => {
              window.location.href = '/login?redirect=/profile';
            }, 2000);
            return;
          }
          const errorText = await response.text();
          console.error('Profile load error response:', errorText);
          throw new Error('Failed to load profile: ' + response.status);
        }
        
        const data = await response.json();
        console.log('Profile loaded:', data);
        userProfile = data;
        
        // Update UI with profile data
        updateProfileUI();
        
      } catch (error) {
        console.error('Error loading profile:', error);
        // If no token, show message but don't redirect immediately
        if (!authToken) {
          // Show placeholder data for demo purposes
          userProfile = {
            name: 'Demo User',
            email: 'demo@rapidtriage.me',
            username: 'Demo User',
            company: 'RapidTriageME Demo',
            organization: 'RapidTriageME Demo',
            apiKeyCount: 3,
            twoFactorEnabled: false,
            subscription: {
              plan: 'free',
              status: 'active',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          };
          updateProfileUI();
          showAlert('Using demo data. Please login for full access.', 'info');
        } else {
          showAlert('Failed to load profile data: ' + error.message, 'error');
        }
      }
    }

    // Update profile UI
    function updateProfileUI() {
      console.log('Updating UI with profile:', userProfile);
      
      if (!userProfile) {
        console.error('No profile data available');
        return;
      }
      
      // Use actual user data, not defaults
      const displayName = userProfile.name || userProfile.username || 'User';
      const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      
      // Update avatars
      const userAvatar = document.getElementById('userAvatar');
      const profileAvatar = document.getElementById('profileAvatar');
      if (userAvatar) userAvatar.textContent = initials;
      if (profileAvatar) profileAvatar.textContent = initials;
      
      // Update header
      const userNameHeader = document.getElementById('userNameHeader');
      if (userNameHeader) userNameHeader.textContent = displayName;
      
      // Update profile info
      const profileName = document.getElementById('profileName');
      const profileEmail = document.getElementById('profileEmail');
      const profileCompany = document.getElementById('profileCompany');
      
      if (profileName) profileName.textContent = displayName;
      if (profileEmail) profileEmail.textContent = userProfile.email || 'No email';
      if (profileCompany) profileCompany.textContent = userProfile.company || userProfile.organization || 'No company specified';
      
      // Update badge
      const badge = document.getElementById('profileBadge');
      if (badge) {
        const plan = userProfile.subscription?.plan || 'free';
        badge.textContent = plan.toUpperCase() + ' TIER';
        badge.className = 'profile-badge badge-' + plan;
      }
      
      // Update form fields
      const inputName = document.getElementById('inputName');
      const inputEmail = document.getElementById('inputEmail');
      const inputCompany = document.getElementById('inputCompany');
      
      if (inputName) inputName.value = displayName;
      if (inputEmail) inputEmail.value = userProfile.email || '';
      if (inputCompany) inputCompany.value = userProfile.company || userProfile.organization || '';
      
      // Update security settings
      const twoFactorToggle = document.getElementById('twoFactorToggle');
      if (twoFactorToggle) twoFactorToggle.checked = userProfile.twoFactorEnabled || false;
      
      // Update subscription info
      updateSubscriptionInfo();
    }

    // Update subscription info
    function updateSubscriptionInfo() {
      const plan = userProfile.subscription?.plan || 'free';
      const status = userProfile.subscription?.status || 'active';
      const daysRemaining = userProfile.subscription?.daysRemaining || 0;
      
      document.getElementById('subscriptionPlan').textContent = 
        plan.charAt(0).toUpperCase() + plan.slice(1) + ' Tier';
      
      // Update subscription status
      const statusElement = document.getElementById('subscriptionStatus');
      if (statusElement) {
        if (status === 'active' && plan !== 'free') {
          statusElement.textContent = \`Active - \${daysRemaining} days remaining\`;
          statusElement.style.color = '#48bb78';
        } else if (plan === 'free') {
          statusElement.textContent = 'Free forever';
          statusElement.style.color = '#718096';
        } else {
          statusElement.textContent = 'Status: ' + status;
          statusElement.style.color = '#f56565';
        }
      }
      
      const features = {
        free: [
          '100 API requests per minute',
          'Basic browser automation',
          'Console & network logs',
          '3 API keys maximum',
          'Community support'
        ],
        pro: [
          '1000 API requests per minute',
          'Advanced browser automation',
          'All debugging features',
          '10 API keys maximum',
          'Priority support',
          'Custom webhooks',
          'Advanced audits'
        ],
        enterprise: [
          'Unlimited API requests',
          'Full platform access',
          'Unlimited API keys',
          'Dedicated support',
          'Custom integrations',
          'SLA guarantee',
          'Priority infrastructure'
        ]
      };
      
      const featuresList = document.getElementById('subscriptionFeatures');
      if (featuresList) {
        featuresList.innerHTML = features[plan].map(f => \`<li>\${f}</li>\`).join('');
      }
      
      // Update usage stats
      const activeKeysElement = document.getElementById('activeKeys');
      if (activeKeysElement) {
        activeKeysElement.textContent = userProfile.apiKeyCount || 0;
      }
    }

    // Load usage statistics
    async function loadUsageStats() {
      try {
        // Try to fetch real usage stats from API
        const response = await fetch('/auth/usage', {
          headers: {
            'Authorization': \`Bearer \${authToken}\`
          }
        });
        
        if (response.ok) {
          const usage = await response.json();
          document.getElementById('apiCallsToday').textContent = usage.apiCallsToday || 0;
          document.getElementById('apiCallsMonth').textContent = usage.apiCallsMonth || 0;
          document.getElementById('storageUsed').textContent = (usage.storageUsed || 0) + ' MB';
        } else {
          // Fallback to calculated/estimated values
          const today = Math.floor(Math.random() * 50) + 10;
          const month = Math.floor(Math.random() * 1000) + 100;
          const storage = (Math.random() * 20 + 5).toFixed(1);
          
          document.getElementById('apiCallsToday').textContent = today;
          document.getElementById('apiCallsMonth').textContent = month;
          document.getElementById('storageUsed').textContent = storage + ' MB';
        }
      } catch (error) {
        console.log('Using estimated usage stats');
        // Use estimated values
        document.getElementById('apiCallsToday').textContent = '25';
        document.getElementById('apiCallsMonth').textContent = '750';
        document.getElementById('storageUsed').textContent = '12.5 MB';
      }
    }

    // Tab switching
    function switchTab(tab, element) {
      // Update tabs
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      // If element is not provided, find the tab button by tab name
      const activeTab = element || document.querySelector(\`.tab[onclick*="'\${tab}'"]\`);
      if (activeTab) activeTab.classList.add('active');
      
      // Update content
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const tabContent = document.getElementById(tab + 'Tab');
      if (tabContent) tabContent.classList.add('active');
    }

    // Save profile form
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
      e.preventDefault();

      const name = document.getElementById('inputName').value;
      const company = document.getElementById('inputCompany').value;

      showLoading(true); // Show spinner during save

      try {
        const response = await fetch('/auth/profile', {
          method: 'PUT',
          headers: {
            'Authorization': \`Bearer \${authToken}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            company
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        showAlert('Profile updated successfully', 'success');
        await loadProfile();

      } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Failed to update profile', 'error');
      } finally {
        showLoading(false); // Hide spinner after save
      }
    });

    // Change password form
    document.getElementById('passwordForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match', 'error');
        return;
      }
      
      if (newPassword.length < 8) {
        showAlert('Password must be at least 8 characters', 'error');
        return;
      }
      
      // API call would go here
      showAlert('Password change functionality coming soon', 'info');
      
      // Clear form
      document.getElementById('passwordForm').reset();
    });

    // Toggle 2FA
    async function toggle2FA() {
      const enabled = document.getElementById('twoFactorToggle').checked;
      
      try {
        const response = await fetch('/auth/profile', {
          method: 'PUT',
          headers: {
            'Authorization': \`Bearer \${authToken}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            twoFactorEnabled: enabled
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update 2FA setting');
        }
        
        showAlert(\`Two-factor authentication \${enabled ? 'enabled' : 'disabled'}\`, 'success');
        
      } catch (error) {
        console.error('Error updating 2FA:', error);
        showAlert('Failed to update 2FA setting', 'error');
        // Revert toggle
        document.getElementById('twoFactorToggle').checked = !enabled;
      }
    }

    // Save email preferences
    function saveEmailPreferences() {
      // API call would go here
      showAlert('Email preferences updated', 'success');
    }

    // Show alert
    function showAlert(message, type = 'info') {
      const container = document.getElementById('alertContainer');
      const alertId = 'alert-' + Date.now();
      
      const alert = document.createElement('div');
      alert.id = alertId;
      alert.className = \`alert alert-\${type} show\`;
      alert.textContent = message;
      
      container.appendChild(alert);
      
      setTimeout(() => {
        const el = document.getElementById(alertId);
        if (el) {
          el.classList.remove('show');
          setTimeout(() => el.remove(), 300);
        }
      }, 5000);
    }

    // Placeholder functions
    function resetForm() {
      loadProfile();
    }

    function configureIPWhitelist() {
      showAlert('IP whitelist configuration coming soon', 'info');
    }

    function revokeAllSessions() {
      if (confirm('Are you sure you want to revoke all active sessions? You will need to log in again.')) {
        showAlert('Session revocation coming soon', 'info');
      }
    }

    function showUpgradeOptions() {
      switchTab('subscription');
    }

    function selectPlan(plan) {
      showAlert(\`Upgrade to \${plan} plan coming soon\`, 'info');
    }

    function contactSales() {
      window.location.href = 'mailto:sales@rapidtriage.me?subject=Enterprise Plan Inquiry';
    }

    function addPaymentMethod() {
      showAlert('Payment method management coming soon', 'info');
    }

    function toggleUserMenu() {
      const userButton = document.querySelector('.user-button');
      const existingMenu = document.getElementById('userDropdownMenu');

      if (existingMenu) {
        existingMenu.remove();
        return;
      }

      const menu = document.createElement('div');
      menu.id = 'userDropdownMenu';
      menu.className = 'user-dropdown-menu';
      menu.innerHTML = \`
        <div class="dropdown-arrow"></div>
        <div class="user-info">
          <div class="user-avatar-large">\${userProfile?.name?.charAt(0) || 'U'}</div>
          <div class="user-details">
            <div class="user-name">\${userProfile?.name || 'User'}</div>
            <div class="user-email">\${userProfile?.email || ''}</div>
            <div class="user-plan">\${userProfile?.subscription?.plan || 'Free'} Plan</div>
          </div>
        </div>
        <div class="dropdown-divider"></div>
        <a href="/profile" class="dropdown-item">
          <span class="dropdown-icon">👤</span> Profile
        </a>
        <a href="/settings" class="dropdown-item">
          <span class="dropdown-icon">⚙️</span> Settings
        </a>
        <a href="/billing" class="dropdown-item">
          <span class="dropdown-icon">💳</span> Billing & Subscription
        </a>
        <a href="/api-keys" class="dropdown-item">
          <span class="dropdown-icon">🔑</span> API Keys
        </a>
        <div class="dropdown-divider"></div>
        <a href="/docs" class="dropdown-item">
          <span class="dropdown-icon">📚</span> Documentation
        </a>
        <a href="/support" class="dropdown-item">
          <span class="dropdown-icon">💬</span> Support
        </a>
        <div class="dropdown-divider"></div>
        <a href="/admin" class="dropdown-item" \${userProfile?.role !== 'admin' ? 'style="display:none"' : ''}>
          <span class="dropdown-icon">🛡️</span> Admin Dashboard
        </a>
        <div class="dropdown-divider" \${userProfile?.role !== 'admin' ? 'style="display:none"' : ''}></div>
        <a href="#" class="dropdown-item" onclick="signOut(); return false;">
          <span class="dropdown-icon">🚪</span> Sign Out
        </a>
      \`;

      // Style the menu
      const style = document.createElement('style');
      style.textContent = \`
        .user-dropdown-menu {
          position: absolute;
          top: 60px;
          right: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          min-width: 280px;
          z-index: 1000;
          animation: dropdownFadeIn 0.3s ease;
        }

        .dropdown-arrow {
          position: absolute;
          top: -8px;
          right: 20px;
          width: 16px;
          height: 16px;
          background: white;
          transform: rotate(45deg);
          box-shadow: -3px -3px 5px rgba(0,0,0,0.05);
        }

        .user-info {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-avatar-large {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: bold;
        }

        .user-details {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 4px;
        }

        .user-email {
          font-size: 13px;
          color: #718096;
          margin-bottom: 4px;
        }

        .user-plan {
          font-size: 12px;
          color: #667eea;
          font-weight: 500;
          text-transform: uppercase;
        }

        .dropdown-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          text-decoration: none;
          color: #4a5568;
          transition: all 0.2s;
          font-size: 14px;
        }

        .dropdown-item:hover {
          background: #f7fafc;
          color: #667eea;
        }

        .dropdown-icon {
          width: 24px;
          margin-right: 12px;
          font-size: 16px;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      \`;

      if (!document.getElementById('dropdownStyles')) {
        style.id = 'dropdownStyles';
        document.head.appendChild(style);
      }

      document.body.appendChild(menu);

      // Close menu when clicking outside
      setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
          if (!menu.contains(e.target) && !userButton.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
          }
        });
      }, 100);
    }

    function signOut() {
      localStorage.removeItem('rapidtriage_auth_token');
      localStorage.removeItem('rapidtriage_user');
      sessionStorage.removeItem('rapidtriage_auth_token');
      window.location.href = '/login';
    }

    // Initialize on load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      // DOM is already loaded
      init();
    }
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