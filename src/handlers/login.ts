/**
 * Login/Registration Page Handler for RapidTriageME
 * Provides user authentication interface
 */

export class LoginHandler {
  private _env: any;

  constructor(env: any) {
    this._env = env;
  }

  /**
   * Serve the login/registration HTML page
   */
  async handleLogin(_request: Request): Promise<Response> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - RapidTriageME</title>
  <meta name="description" content="Sign in to RapidTriageME - Enterprise Browser Automation & Debugging Platform">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .auth-container {
      background: rgba(255, 255, 255, 0.98);
      border-radius: 20px;
      box-shadow: 0 25px 70px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 480px;
      overflow: hidden;
    }
    
    .auth-header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .tagline {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .auth-body {
      padding: 40px 30px;
    }
    
    .auth-tabs {
      display: flex;
      margin-bottom: 30px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .auth-tab {
      flex: 1;
      padding: 12px;
      background: none;
      border: none;
      font-size: 16px;
      font-weight: 500;
      color: #718096;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
    }
    
    .auth-tab.active {
      color: #667eea;
    }
    
    .auth-tab.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background: #667eea;
    }
    
    .auth-form {
      display: none;
    }
    
    .auth-form.active {
      display: block;
      animation: fadeIn 0.3s;
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
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.3s;
    }
    
    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .form-input.error {
      border-color: #f56565;
    }
    
    .form-error {
      color: #f56565;
      font-size: 13px;
      margin-top: 5px;
      display: none;
    }
    
    .form-error.show {
      display: block;
    }
    
    .password-wrapper {
      position: relative;
    }
    
    .password-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #718096;
      cursor: pointer;
      font-size: 18px;
    }
    
    .password-strength {
      height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      margin-top: 8px;
      overflow: hidden;
    }
    
    .password-strength-bar {
      height: 100%;
      transition: all 0.3s;
      border-radius: 2px;
    }
    
    .password-strength-bar.weak {
      width: 33%;
      background: #f56565;
    }
    
    .password-strength-bar.medium {
      width: 66%;
      background: #f6ad55;
    }
    
    .password-strength-bar.strong {
      width: 100%;
      background: #48bb78;
    }
    
    .form-checkbox-group {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
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
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }
    
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .divider {
      text-align: center;
      margin: 25px 0;
      position: relative;
    }
    
    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e2e8f0;
    }
    
    .divider span {
      background: white;
      padding: 0 15px;
      color: #718096;
      font-size: 14px;
      position: relative;
    }
    
    .social-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .btn-social {
      flex: 1;
      padding: 10px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      font-size: 14px;
      color: #4a5568;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .btn-social:hover {
      background: #f7fafc;
      border-color: #cbd5e0;
    }
    
    .auth-footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    
    .auth-footer a {
      color: #667eea;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.3s;
    }
    
    .auth-footer a:hover {
      color: #764ba2;
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
    
    .demo-hint {
      background: #e6fffa;
      border: 1px solid #38b2ac;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #234e52;
      line-height: 1.5;
    }
    
    .demo-hint strong {
      color: #2c7a7b;
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
    
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideDown {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    @media (max-width: 480px) {
      .auth-container {
        border-radius: 0;
        min-height: 100vh;
      }
    }
  </style>
</head>
<body>
  <div class="auth-container">
    <div class="auth-header">
      <div class="logo">🚀 RapidTriageME</div>
      <div class="tagline">Enterprise Browser Automation & Debugging Platform</div>
    </div>
    
    <div class="auth-body">
      <!-- Alert Container -->
      <div id="alertContainer"></div>
      
      <!-- Tab Navigation -->
      <div class="auth-tabs">
        <button class="auth-tab active" onclick="switchTab('login')">Sign In</button>
        <button class="auth-tab" onclick="switchTab('register')">Sign Up</button>
      </div>
      
      <!-- Login Form -->
      <form id="loginForm" class="auth-form active">
        <div class="demo-hint">
          <strong>🔑 Demo Account:</strong><br>
          Email: <code>demo@example.com</code><br>
          Password: <code>demo1234</code>
        </div>
        
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-input" id="loginEmail" placeholder="you@example.com" required>
          <div class="form-error" id="loginEmailError"></div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="password-wrapper">
            <input type="password" class="form-input" id="loginPassword" placeholder="Enter your password" required>
            <button type="button" class="password-toggle" onclick="togglePassword('loginPassword')">👁</button>
          </div>
          <div class="form-error" id="loginPasswordError"></div>
        </div>
        
        <div class="form-checkbox-group">
          <input type="checkbox" class="form-checkbox" id="rememberMe">
          <label for="rememberMe" class="form-checkbox-label">Remember me for 30 days</label>
        </div>
        
        <button type="submit" class="btn btn-primary" id="loginButton">
          Sign In
        </button>
        
        <div class="divider">
          <span>OR</span>
        </div>
        
        <div class="social-buttons">
          <button type="button" class="btn-social" onclick="socialLogin('google')">
            🔍 Google
          </button>
          <button type="button" class="btn-social" onclick="socialLogin('github')">
            💻 GitHub
          </button>
          <button type="button" class="btn-social" onclick="socialLogin('microsoft')">
            🏢 Microsoft
          </button>
        </div>
        
        <div class="auth-footer">
          <a href="#" onclick="showForgotPassword(); return false;">Forgot your password?</a>
        </div>
      </form>
      
      <!-- Register Form -->
      <form id="registerForm" class="auth-form">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" class="form-input" id="registerName" placeholder="John Doe" required>
          <div class="form-error" id="registerNameError"></div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Email Address *</label>
          <input type="email" class="form-input" id="registerEmail" placeholder="you@example.com" required>
          <div class="form-error" id="registerEmailError"></div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Password *</label>
          <div class="password-wrapper">
            <input type="password" class="form-input" id="registerPassword" placeholder="Create a strong password" required>
            <button type="button" class="password-toggle" onclick="togglePassword('registerPassword')">👁</button>
          </div>
          <div class="password-strength">
            <div class="password-strength-bar" id="passwordStrengthBar"></div>
          </div>
          <div class="form-error" id="registerPasswordError"></div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Company (Optional)</label>
          <input type="text" class="form-input" id="registerCompany" placeholder="Your company name">
        </div>
        
        <div class="form-group">
          <label class="form-label">Referral Code (Optional)</label>
          <input type="text" class="form-input" id="registerReferral" placeholder="Enter referral code">
        </div>
        
        <div class="form-checkbox-group">
          <input type="checkbox" class="form-checkbox" id="agreeTerms" required>
          <label for="agreeTerms" class="form-checkbox-label">
            I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
          </label>
        </div>
        
        <button type="submit" class="btn btn-primary" id="registerButton">
          Create Account
        </button>
        
        <div class="divider">
          <span>OR</span>
        </div>
        
        <div class="social-buttons">
          <button type="button" class="btn-social" onclick="socialLogin('google')">
            🔍 Google
          </button>
          <button type="button" class="btn-social" onclick="socialLogin('github')">
            💻 GitHub
          </button>
          <button type="button" class="btn-social" onclick="socialLogin('microsoft')">
            🏢 Microsoft
          </button>
        </div>
        
        <div class="auth-footer">
          Already have an account? <a href="#" onclick="switchTab('login'); return false;">Sign in</a>
        </div>
      </form>
    </div>
  </div>
  
  <script>
    // Tab switching
    function switchTab(tab) {
      // Update tab buttons
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
      
      // Update forms
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      document.getElementById(tab + 'Form').classList.add('active');
      
      // Clear alerts
      clearAlerts();
    }
    
    // Password toggle
    function togglePassword(inputId) {
      const input = document.getElementById(inputId);
      const type = input.type === 'password' ? 'text' : 'password';
      input.type = type;
      event.target.textContent = type === 'password' ? '👁' : '👁‍🗨';
    }
    
    // Password strength checker
    document.getElementById('registerPassword').addEventListener('input', function(e) {
      const password = e.target.value;
      const strengthBar = document.getElementById('passwordStrengthBar');
      
      if (password.length === 0) {
        strengthBar.className = 'password-strength-bar';
        return;
      }
      
      let strength = 0;
      if (password.length >= 8) strength++;
      if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
      if (password.match(/[0-9]/)) strength++;
      if (password.match(/[^a-zA-Z0-9]/)) strength++;
      
      if (strength <= 1) {
        strengthBar.className = 'password-strength-bar weak';
      } else if (strength === 2) {
        strengthBar.className = 'password-strength-bar medium';
      } else {
        strengthBar.className = 'password-strength-bar strong';
      }
    });
    
    // Show alert
    function showAlert(message, type = 'error') {
      const container = document.getElementById('alertContainer');
      container.innerHTML = \`<div class="alert alert-\${type} show">\${message}</div>\`;
      
      setTimeout(() => {
        clearAlerts();
      }, 5000);
    }
    
    // Clear alerts
    function clearAlerts() {
      document.getElementById('alertContainer').innerHTML = '';
    }
    
    // Clear form errors
    function clearFormErrors() {
      document.querySelectorAll('.form-error').forEach(e => {
        e.textContent = '';
        e.classList.remove('show');
      });
      document.querySelectorAll('.form-input').forEach(i => {
        i.classList.remove('error');
      });
    }
    
    // Show form error
    function showFormError(inputId, message) {
      const input = document.getElementById(inputId);
      const error = document.getElementById(inputId + 'Error');
      
      input.classList.add('error');
      error.textContent = message;
      error.classList.add('show');
    }
    
    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      clearFormErrors();
      clearAlerts();
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const rememberMe = document.getElementById('rememberMe').checked;
      
      // Validate
      if (!email) {
        showFormError('loginEmail', 'Email is required');
        return;
      }
      
      if (!password) {
        showFormError('loginPassword', 'Password is required');
        return;
      }
      
      // Show loading
      const button = document.getElementById('loginButton');
      const originalText = button.innerHTML;
      button.innerHTML = '<span class="loading"></span> Signing in...';
      button.disabled = true;
      
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Store token
          if (rememberMe) {
            localStorage.setItem('rapidtriage_auth_token', data.token);
            localStorage.setItem('rapidtriage_refresh_token', data.refreshToken);
          } else {
            sessionStorage.setItem('rapidtriage_auth_token', data.token);
            sessionStorage.setItem('rapidtriage_refresh_token', data.refreshToken);
          }
          
          // Store user data
          localStorage.setItem('rapidtriage_user', JSON.stringify(data.user));
          
          showAlert('Login successful! Redirecting...', 'success');
          
          // Redirect to dashboard or requested page
          const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
          setTimeout(() => {
            window.location.href = redirect;
          }, 1000);
          
        } else {
          // Handle errors
          if (data.code === 'INVALID_CREDENTIALS') {
            showAlert('Invalid email or password. Please try again.');
          } else if (data.code === '2FA_REQUIRED') {
            // Show 2FA input (future implementation)
            showAlert('Two-factor authentication required.');
          } else {
            showAlert(data.message || 'Login failed. Please try again.');
          }
        }
        
      } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please check your connection and try again.');
      } finally {
        button.innerHTML = originalText;
        button.disabled = false;
      }
    });
    
    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      clearFormErrors();
      clearAlerts();
      
      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const company = document.getElementById('registerCompany').value;
      const referralCode = document.getElementById('registerReferral').value;
      const agreeTerms = document.getElementById('agreeTerms').checked;
      
      // Validate
      if (!name) {
        showFormError('registerName', 'Name is required');
        return;
      }
      
      if (!email) {
        showFormError('registerEmail', 'Email is required');
        return;
      }
      
      if (!email.match(/^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$/)) {
        showFormError('registerEmail', 'Please enter a valid email address');
        return;
      }
      
      if (!password) {
        showFormError('registerPassword', 'Password is required');
        return;
      }
      
      if (password.length < 8) {
        showFormError('registerPassword', 'Password must be at least 8 characters');
        return;
      }
      
      if (!agreeTerms) {
        showAlert('You must agree to the Terms of Service and Privacy Policy');
        return;
      }
      
      // Show loading
      const button = document.getElementById('registerButton');
      const originalText = button.innerHTML;
      button.innerHTML = '<span class="loading"></span> Creating account...';
      button.disabled = true;
      
      try {
        const response = await fetch('/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            password,
            company,
            referralCode
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Store token
          localStorage.setItem('rapidtriage_auth_token', data.token);
          localStorage.setItem('rapidtriage_refresh_token', data.refreshToken);
          localStorage.setItem('rapidtriage_user', JSON.stringify(data.user));
          
          showAlert('Account created successfully! Redirecting to dashboard...', 'success');
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
          
        } else {
          // Handle errors
          if (data.code === 'USER_EXISTS') {
            showFormError('registerEmail', 'An account with this email already exists');
          } else if (data.code === 'WEAK_PASSWORD') {
            showFormError('registerPassword', data.message || 'Password is too weak');
          } else if (data.code === 'INVALID_EMAIL') {
            showFormError('registerEmail', 'Please enter a valid email address');
          } else {
            showAlert(data.message || 'Registration failed. Please try again.');
          }
        }
        
      } catch (error) {
        console.error('Registration error:', error);
        showAlert('Network error. Please check your connection and try again.');
      } finally {
        button.innerHTML = originalText;
        button.disabled = false;
      }
    });
    
    // Social login (placeholder)
    function socialLogin(provider) {
      showAlert(\`Social login with \${provider} is coming soon!\`, 'error');
    }
    
    // Forgot password (placeholder)
    function showForgotPassword() {
      showAlert('Password reset functionality coming soon! Please contact support.', 'error');
    }
    
    // Check if already logged in
    function checkAuth() {
      const token = localStorage.getItem('rapidtriage_auth_token') || 
                   sessionStorage.getItem('rapidtriage_auth_token');
      
      if (token) {
        // Redirect to dashboard if already logged in
        const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
        window.location.href = redirect;
      }
    }
    
    // Initialize
    checkAuth();
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