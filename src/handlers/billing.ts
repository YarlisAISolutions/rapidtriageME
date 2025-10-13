/**
 * Billing & Payment Handler for RapidTriageME
 * Handles subscription management, payment processing, and invoicing
 */

export class BillingHandler {
  private env: any;

  constructor(env: any) {
    this.env = env;
  }

  /**
   * Serve the billing & subscription management page
   */
  async handleBilling(request: Request): Promise<Response> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Billing & Subscription - RapidTriageME</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f7fafc;
      min-height: 100vh;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      padding: 15px 0;
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
      color: white;
      text-decoration: none;
    }

    .nav-menu {
      display: flex;
      gap: 30px;
    }

    .nav-menu a {
      color: white;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 8px;
      transition: background 0.3s;
    }

    .nav-menu a:hover,
    .nav-menu a.active {
      background: rgba(255,255,255,0.2);
    }

    /* Main Content */
    .container {
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 20px;
    }

    .page-title {
      font-size: 32px;
      color: #1a202c;
      margin-bottom: 10px;
    }

    .page-subtitle {
      color: #718096;
      margin-bottom: 40px;
    }

    /* Current Plan Card */
    .current-plan {
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
      margin-bottom: 40px;
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 30px;
    }

    .plan-info h2 {
      font-size: 24px;
      color: #2d3748;
      margin-bottom: 10px;
    }

    .plan-badge {
      display: inline-block;
      padding: 6px 12px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-left: 10px;
    }

    .plan-price {
      font-size: 48px;
      font-weight: bold;
      color: #667eea;
    }

    .plan-period {
      color: #718096;
      font-size: 16px;
    }

    .usage-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      padding: 20px;
      background: #f7fafc;
      border-radius: 12px;
    }

    .stat-label {
      color: #718096;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 8px;
    }

    .stat-progress {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .stat-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s;
    }

    /* Pricing Plans */
    .pricing-section {
      margin-bottom: 40px;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin-top: 30px;
    }

    .pricing-card {
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
      position: relative;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .pricing-card.recommended {
      border: 2px solid #667eea;
      transform: scale(1.05);
    }

    .pricing-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .recommended-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #667eea;
      color: white;
      padding: 4px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .plan-name {
      font-size: 24px;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 10px;
    }

    .plan-description {
      color: #718096;
      margin-bottom: 20px;
      min-height: 50px;
    }

    .plan-pricing {
      margin-bottom: 30px;
    }

    .plan-price-amount {
      font-size: 48px;
      font-weight: bold;
      color: #2d3748;
    }

    .plan-features {
      list-style: none;
      margin-bottom: 30px;
    }

    .plan-features li {
      padding: 10px 0;
      color: #4a5568;
      display: flex;
      align-items: center;
    }

    .plan-features li:before {
      content: '✓';
      color: #48bb78;
      font-weight: bold;
      margin-right: 10px;
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

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn-secondary:hover {
      background: #667eea;
      color: white;
    }

    /* Payment Methods */
    .payment-methods {
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
      margin-bottom: 40px;
    }

    .payment-method-list {
      margin-top: 20px;
    }

    .payment-method {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 15px;
    }

    .payment-method-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .payment-icon {
      width: 50px;
      height: 32px;
      background: #f7fafc;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    /* Invoice History */
    .invoices-section {
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
    }

    .invoice-table {
      width: 100%;
      margin-top: 20px;
    }

    .invoice-table th {
      text-align: left;
      padding: 12px;
      color: #718096;
      font-size: 14px;
      border-bottom: 1px solid #e2e8f0;
    }

    .invoice-table td {
      padding: 15px 12px;
      border-bottom: 1px solid #f7fafc;
    }

    .invoice-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-paid {
      background: #c6f6d5;
      color: #22543d;
    }

    .status-pending {
      background: #fed7e2;
      color: #742a2a;
    }

    .btn-download {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }

    .btn-download:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-content">
      <a href="/" class="logo">🚀 RapidTriageME</a>
      <nav class="nav-menu">
        <a href="/dashboard">Dashboard</a>
        <a href="/profile">Profile</a>
        <a href="/billing" class="active">Billing</a>
        <a href="/api-keys">API Keys</a>
        <a href="/support">Support</a>
      </nav>
    </div>
  </div>

  <div class="container">
    <h1 class="page-title">Billing & Subscription</h1>
    <p class="page-subtitle">Manage your subscription, payment methods, and invoices</p>

    <!-- Current Plan -->
    <div class="current-plan">
      <div class="plan-header">
        <div class="plan-info">
          <h2>Current Plan <span class="plan-badge">PRO</span></h2>
          <p style="color: #718096;">Your subscription renews on January 31, 2025</p>
        </div>
        <div>
          <div class="plan-price">$29<span class="plan-period">/month</span></div>
        </div>
      </div>

      <div class="usage-stats">
        <div class="stat-card">
          <div class="stat-label">API Calls</div>
          <div class="stat-value">24,531 / 100,000</div>
          <div class="stat-progress">
            <div class="stat-progress-bar" style="width: 24.5%"></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Screenshots</div>
          <div class="stat-value">1,245 / 10,000</div>
          <div class="stat-progress">
            <div class="stat-progress-bar" style="width: 12.4%"></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Audits Run</div>
          <div class="stat-value">342 / 1,000</div>
          <div class="stat-progress">
            <div class="stat-progress-bar" style="width: 34.2%"></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Team Members</div>
          <div class="stat-value">3 / 5</div>
          <div class="stat-progress">
            <div class="stat-progress-bar" style="width: 60%"></div>
          </div>
        </div>
      </div>

      <button class="btn btn-secondary" onclick="managePlan()">Change Plan</button>
    </div>

    <!-- Available Plans -->
    <div class="pricing-section">
      <h2 style="font-size: 24px; margin-bottom: 10px;">Available Plans</h2>
      <p style="color: #718096;">Choose the plan that best fits your needs</p>

      <div class="pricing-grid">
        <!-- Free Plan -->
        <div class="pricing-card">
          <div class="plan-name">Free</div>
          <div class="plan-description">Perfect for trying out RapidTriageME</div>
          <div class="plan-pricing">
            <span class="plan-price-amount">$0</span>
            <span class="plan-period">/month</span>
          </div>
          <ul class="plan-features">
            <li>100 API calls/month</li>
            <li>10 screenshots/month</li>
            <li>Basic browser debugging</li>
            <li>Community support</li>
            <li>7-day data retention</li>
          </ul>
          <button class="btn btn-secondary" onclick="selectPlan('free')">Downgrade</button>
        </div>

        <!-- Pro Plan -->
        <div class="pricing-card recommended">
          <span class="recommended-badge">RECOMMENDED</span>
          <div class="plan-name">Professional</div>
          <div class="plan-description">For professional developers and small teams</div>
          <div class="plan-pricing">
            <span class="plan-price-amount">$29</span>
            <span class="plan-period">/month</span>
          </div>
          <ul class="plan-features">
            <li>100,000 API calls/month</li>
            <li>10,000 screenshots/month</li>
            <li>Advanced debugging tools</li>
            <li>Priority email support</li>
            <li>30-day data retention</li>
            <li>Up to 5 team members</li>
            <li>Custom integrations</li>
            <li>API rate limit: 100 req/min</li>
          </ul>
          <button class="btn btn-primary">Current Plan</button>
        </div>

        <!-- Enterprise Plan -->
        <div class="pricing-card">
          <div class="plan-name">Enterprise</div>
          <div class="plan-description">For large teams and organizations</div>
          <div class="plan-pricing">
            <span class="plan-price-amount">Custom</span>
          </div>
          <ul class="plan-features">
            <li>Unlimited API calls</li>
            <li>Unlimited screenshots</li>
            <li>Premium debugging suite</li>
            <li>24/7 phone & email support</li>
            <li>Unlimited data retention</li>
            <li>Unlimited team members</li>
            <li>SLA guarantee</li>
            <li>Custom API limits</li>
            <li>Dedicated account manager</li>
            <li>On-premise deployment option</li>
          </ul>
          <button class="btn btn-secondary" onclick="contactSales()">Contact Sales</button>
        </div>
      </div>
    </div>

    <!-- Payment Methods -->
    <div class="payment-methods">
      <h2 style="font-size: 24px; margin-bottom: 10px;">Payment Methods</h2>
      <p style="color: #718096;">Manage your payment methods</p>

      <div class="payment-method-list">
        <div class="payment-method">
          <div class="payment-method-info">
            <div class="payment-icon">💳</div>
            <div>
              <div style="font-weight: 600;">•••• •••• •••• 4242</div>
              <div style="color: #718096; font-size: 14px;">Expires 12/2025</div>
            </div>
          </div>
          <div>
            <span style="background: #c6f6d5; color: #22543d; padding: 4px 12px; border-radius: 20px; font-size: 12px;">Default</span>
          </div>
        </div>
      </div>

      <button class="btn btn-secondary" onclick="addPaymentMethod()">Add Payment Method</button>
    </div>

    <!-- Invoice History -->
    <div class="invoices-section">
      <h2 style="font-size: 24px; margin-bottom: 10px;">Invoice History</h2>
      <p style="color: #718096;">Download your past invoices</p>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Jan 1, 2025</td>
            <td>Professional Plan - Monthly</td>
            <td>$29.00</td>
            <td><span class="invoice-status status-paid">Paid</span></td>
            <td><a href="#" class="btn-download">Download</a></td>
          </tr>
          <tr>
            <td>Dec 1, 2024</td>
            <td>Professional Plan - Monthly</td>
            <td>$29.00</td>
            <td><span class="invoice-status status-paid">Paid</span></td>
            <td><a href="#" class="btn-download">Download</a></td>
          </tr>
          <tr>
            <td>Nov 1, 2024</td>
            <td>Professional Plan - Monthly</td>
            <td>$29.00</td>
            <td><span class="invoice-status status-paid">Paid</span></td>
            <td><a href="#" class="btn-download">Download</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    function selectPlan(plan) {
      if (plan === 'free') {
        if (confirm('Are you sure you want to downgrade to the Free plan? You will lose access to Pro features.')) {
          alert('Downgrade request submitted. You will receive a confirmation email.');
        }
      } else {
        alert('Redirecting to payment page...');
      }
    }

    function contactSales() {
      window.location.href = '/support?subject=enterprise';
    }

    function managePlan() {
      document.querySelector('.pricing-section').scrollIntoView({ behavior: 'smooth' });
    }

    function addPaymentMethod() {
      alert('Stripe payment integration will be added here');
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  }
}