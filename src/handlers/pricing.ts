/**
 * Pricing Page Handler for RapidTriageME
 * Public pricing page with plans and features
 */

export class PricingHandler {
  async handlePricing(_request: Request): Promise<Response> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing - RapidTriageME</title>
  <meta name="description" content="Simple, transparent pricing for browser debugging and automation. Start free, upgrade as you grow.">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }

    /* Header */
    .header {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 20px 0;
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
      font-size: 28px;
      font-weight: bold;
      color: white;
      text-decoration: none;
    }

    .nav-menu {
      display: flex;
      gap: 30px;
      align-items: center;
    }

    .nav-menu a {
      color: white;
      text-decoration: none;
      font-weight: 500;
    }

    .btn-header {
      background: white;
      color: #667eea;
      padding: 10px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.3s;
    }

    .btn-header:hover {
      transform: translateY(-2px);
    }

    /* Hero Section */
    .hero {
      text-align: center;
      padding: 80px 20px;
      color: white;
    }

    .hero h1 {
      font-size: 48px;
      margin-bottom: 20px;
      font-weight: 700;
    }

    .hero p {
      font-size: 20px;
      opacity: 0.95;
      max-width: 600px;
      margin: 0 auto 40px;
    }

    .pricing-toggle {
      display: inline-flex;
      background: rgba(255,255,255,0.2);
      border-radius: 30px;
      padding: 4px;
    }

    .toggle-btn {
      padding: 10px 24px;
      border: none;
      background: transparent;
      color: white;
      cursor: pointer;
      border-radius: 26px;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.3s;
    }

    .toggle-btn.active {
      background: white;
      color: #667eea;
    }

    .save-badge {
      background: #48bb78;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      margin-left: 5px;
    }

    /* Pricing Cards */
    .pricing-container {
      max-width: 1200px;
      margin: -50px auto 100px;
      padding: 0 20px;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 30px;
    }

    .pricing-card {
      background: white;
      border-radius: 20px;
      padding: 40px 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      position: relative;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .pricing-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 30px 80px rgba(0,0,0,0.2);
    }

    .pricing-card.featured {
      border: 3px solid #667eea;
      transform: scale(1.05);
    }

    .popular-badge {
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 6px 24px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }

    .plan-name {
      font-size: 28px;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 10px;
    }

    .plan-description {
      color: #718096;
      margin-bottom: 30px;
      font-size: 16px;
    }

    .price-wrapper {
      margin-bottom: 30px;
    }

    .price {
      font-size: 56px;
      font-weight: bold;
      color: #2d3748;
    }

    .price-period {
      color: #718096;
      font-size: 18px;
    }

    .price-annual {
      color: #718096;
      font-size: 14px;
      margin-top: 5px;
    }

    .features-list {
      list-style: none;
      margin-bottom: 40px;
    }

    .features-list li {
      padding: 12px 0;
      color: #4a5568;
      display: flex;
      align-items: start;
      font-size: 15px;
    }

    .features-list li:before {
      content: '✓';
      color: #48bb78;
      font-weight: bold;
      margin-right: 12px;
      font-size: 18px;
    }

    .btn-plan {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 10px;
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
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #e2e8f0;
    }

    .btn-secondary:hover {
      border-color: #667eea;
      background: #f7fafc;
    }

    /* Feature Comparison */
    .comparison-section {
      max-width: 1200px;
      margin: 100px auto;
      padding: 0 20px;
    }

    .comparison-title {
      text-align: center;
      font-size: 36px;
      color: white;
      margin-bottom: 50px;
    }

    .comparison-table {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }

    .comparison-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .comparison-table th {
      background: #f7fafc;
      padding: 20px;
      text-align: left;
      font-weight: 600;
      color: #2d3748;
      border-bottom: 1px solid #e2e8f0;
    }

    .comparison-table td {
      padding: 20px;
      border-bottom: 1px solid #f7fafc;
      color: #4a5568;
    }

    .comparison-table .check {
      color: #48bb78;
      font-weight: bold;
      font-size: 20px;
    }

    .comparison-table .cross {
      color: #fc8181;
      font-weight: bold;
      font-size: 20px;
    }

    /* FAQ Section */
    .faq-section {
      max-width: 900px;
      margin: 100px auto;
      padding: 0 20px;
      color: white;
    }

    .faq-title {
      text-align: center;
      font-size: 36px;
      margin-bottom: 50px;
    }

    .faq-item {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      margin-bottom: 20px;
      overflow: hidden;
    }

    .faq-question {
      padding: 24px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .faq-question:hover {
      background: rgba(255,255,255,0.05);
    }

    .faq-answer {
      padding: 0 24px 24px;
      display: none;
      line-height: 1.6;
      opacity: 0.9;
    }

    .faq-item.active .faq-answer {
      display: block;
    }

    .faq-toggle {
      font-size: 24px;
      transition: transform 0.3s;
    }

    .faq-item.active .faq-toggle {
      transform: rotate(45deg);
    }

    /* CTA Section */
    .cta-section {
      text-align: center;
      padding: 100px 20px;
      color: white;
    }

    .cta-title {
      font-size: 42px;
      margin-bottom: 20px;
    }

    .cta-subtitle {
      font-size: 20px;
      opacity: 0.95;
      margin-bottom: 40px;
    }

    .cta-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
    }

    .btn-cta {
      padding: 16px 32px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.3s;
    }

    .btn-cta-primary {
      background: white;
      color: #667eea;
    }

    .btn-cta-primary:hover {
      transform: translateY(-2px);
    }

    .btn-cta-secondary {
      background: transparent;
      color: white;
      border: 2px solid white;
    }

    .btn-cta-secondary:hover {
      background: rgba(255,255,255,0.1);
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 36px;
      }

      .pricing-grid {
        grid-template-columns: 1fr;
      }

      .pricing-card.featured {
        transform: scale(1);
      }

      .comparison-table {
        overflow-x: auto;
      }

      .cta-buttons {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <a href="/" class="logo">🚀 RapidTriageME</a>
      <nav class="nav-menu">
        <a href="/features">Features</a>
        <a href="/pricing" style="font-weight: 600;">Pricing</a>
        <a href="/docs">Docs</a>
        <a href="/login">Sign In</a>
        <a href="/register" class="btn-header">Start Free Trial</a>
      </nav>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <h1>Simple, Transparent Pricing</h1>
    <p>Start with our free tier and scale as you grow. No hidden fees, cancel anytime.</p>

    <div class="pricing-toggle">
      <button class="toggle-btn active" onclick="togglePricing('monthly')">Monthly</button>
      <button class="toggle-btn" onclick="togglePricing('annual')">Annual <span class="save-badge">Save 20%</span></button>
    </div>
  </section>

  <!-- Pricing Cards -->
  <div class="pricing-container">
    <div class="pricing-grid">
      <!-- Free Plan -->
      <div class="pricing-card">
        <h3 class="plan-name">Starter</h3>
        <p class="plan-description">Perfect for individuals getting started</p>

        <div class="price-wrapper">
          <span class="price" data-monthly="0" data-annual="0">$0</span>
          <span class="price-period">/month</span>
        </div>

        <ul class="features-list">
          <li>100 API calls per month</li>
          <li>10 screenshots per month</li>
          <li>Basic browser debugging</li>
          <li>7-day data retention</li>
          <li>Community support</li>
          <li>1 user account</li>
        </ul>

        <button class="btn-plan btn-secondary" onclick="selectPlan('starter')">Start Free</button>
      </div>

      <!-- Pro Plan -->
      <div class="pricing-card featured">
        <span class="popular-badge">MOST POPULAR</span>
        <h3 class="plan-name">Professional</h3>
        <p class="plan-description">For professionals and growing teams</p>

        <div class="price-wrapper">
          <span class="price" data-monthly="29" data-annual="23">$29</span>
          <span class="price-period">/month</span>
          <div class="price-annual" style="display: none;">$276 billed annually</div>
        </div>

        <ul class="features-list">
          <li>100,000 API calls per month</li>
          <li>10,000 screenshots per month</li>
          <li>Advanced debugging tools</li>
          <li>30-day data retention</li>
          <li>Priority email support</li>
          <li>Up to 5 team members</li>
          <li>Custom integrations</li>
          <li>API rate limit: 100 req/min</li>
          <li>Lighthouse audits</li>
          <li>Performance monitoring</li>
        </ul>

        <button class="btn-plan btn-primary" onclick="selectPlan('professional')">Start 14-Day Trial</button>
      </div>

      <!-- Enterprise Plan -->
      <div class="pricing-card">
        <h3 class="plan-name">Enterprise</h3>
        <p class="plan-description">For large teams and organizations</p>

        <div class="price-wrapper">
          <span class="price" style="font-size: 36px;">Custom</span>
          <span class="price-period"></span>
        </div>

        <ul class="features-list">
          <li>Unlimited API calls</li>
          <li>Unlimited screenshots</li>
          <li>Premium debugging suite</li>
          <li>Unlimited data retention</li>
          <li>24/7 phone & email support</li>
          <li>Unlimited team members</li>
          <li>Custom API limits</li>
          <li>SLA guarantee (99.9%)</li>
          <li>Dedicated account manager</li>
          <li>On-premise deployment</li>
          <li>Custom training & onboarding</li>
          <li>Advanced security features</li>
        </ul>

        <button class="btn-plan btn-secondary" onclick="contactSales()">Contact Sales</button>
      </div>
    </div>
  </div>

  <!-- Feature Comparison -->
  <section class="comparison-section">
    <h2 class="comparison-title">Detailed Feature Comparison</h2>

    <div class="comparison-table">
      <table>
        <thead>
          <tr>
            <th style="width: 40%;">Feature</th>
            <th style="text-align: center;">Starter</th>
            <th style="text-align: center;">Professional</th>
            <th style="text-align: center;">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Core Features</strong></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>Browser Debugging</td>
            <td style="text-align: center;"><span class="check">✓</span></td>
            <td style="text-align: center;"><span class="check">✓</span></td>
            <td style="text-align: center;"><span class="check">✓</span></td>
          </tr>
          <tr>
            <td>Console Log Capture</td>
            <td style="text-align: center;"><span class="check">✓</span></td>
            <td style="text-align: center;"><span class="check">✓</span></td>
            <td style="text-align: center;"><span class="check">✓</span></td>
          </tr>
          <tr>
            <td>Network Monitoring</td>
            <td style="text-align: center;">Basic</td>
            <td style="text-align: center;">Advanced</td>
            <td style="text-align: center;">Premium</td>
          </tr>
          <tr>
            <td>Screenshot Capture</td>
            <td style="text-align: center;">10/month</td>
            <td style="text-align: center;">10,000/month</td>
            <td style="text-align: center;">Unlimited</td>
          </tr>
          <tr>
            <td><strong>Advanced Features</strong></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>Lighthouse Audits</td>
            <td style="text-align: center;"><span class="cross">✗</span></td>
            <td style="text-align: center;"><span class="check">✓</span></td>
            <td style="text-align: center;"><span class="check">✓</span></td>
          </tr>
          <tr>
            <td>Performance Monitoring</td>
            <td style="text-align: center;"><span class="cross">✗</span></td>
            <td style="text-align: center;"><span class="check">✓</span></td>
            <td style="text-align: center;"><span class="check">✓</span></td>
          </tr>
          <tr>
            <td>Custom Integrations</td>
            <td style="text-align: center;"><span class="cross">✗</span></td>
            <td style="text-align: center;"><span class="check">✓</span></td>
            <td style="text-align: center;"><span class="check">✓</span></td>
          </tr>
          <tr>
            <td>API Access</td>
            <td style="text-align: center;">Limited</td>
            <td style="text-align: center;">Full</td>
            <td style="text-align: center;">Full + Priority</td>
          </tr>
          <tr>
            <td><strong>Support & SLA</strong></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>Support Level</td>
            <td style="text-align: center;">Community</td>
            <td style="text-align: center;">Priority Email</td>
            <td style="text-align: center;">24/7 Phone & Email</td>
          </tr>
          <tr>
            <td>Response Time</td>
            <td style="text-align: center;">Best effort</td>
            <td style="text-align: center;">&lt; 24 hours</td>
            <td style="text-align: center;">&lt; 1 hour</td>
          </tr>
          <tr>
            <td>SLA Guarantee</td>
            <td style="text-align: center;"><span class="cross">✗</span></td>
            <td style="text-align: center;"><span class="cross">✗</span></td>
            <td style="text-align: center;">99.9%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="faq-section">
    <h2 class="faq-title">Frequently Asked Questions</h2>

    <div class="faq-item">
      <div class="faq-question" onclick="toggleFAQ(this)">
        Can I change plans anytime?
        <span class="faq-toggle">+</span>
      </div>
      <div class="faq-answer">
        Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged a prorated amount for the remainder of the billing cycle. When downgrading, the change will take effect at the next billing cycle.
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-question" onclick="toggleFAQ(this)">
        What payment methods do you accept?
        <span class="faq-toggle">+</span>
      </div>
      <div class="faq-answer">
        We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor Stripe. Enterprise customers can also pay via invoice and bank transfer.
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-question" onclick="toggleFAQ(this)">
        Is there a free trial for the Professional plan?
        <span class="faq-toggle">+</span>
      </div>
      <div class="faq-answer">
        Yes! We offer a 14-day free trial for the Professional plan. No credit card required to start your trial. You'll have full access to all Professional features during the trial period.
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-question" onclick="toggleFAQ(this)">
        What happens if I exceed my usage limits?
        <span class="faq-toggle">+</span>
      </div>
      <div class="faq-answer">
        We'll send you notifications when you're approaching your limits. If you exceed them, you can either upgrade your plan or purchase additional capacity. We never stop your service unexpectedly.
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-question" onclick="toggleFAQ(this)">
        Do you offer discounts for non-profits or education?
        <span class="faq-toggle">+</span>
      </div>
      <div class="faq-answer">
        Yes! We offer 50% discounts for qualified non-profit organizations and educational institutions. Contact our support team with proof of your organization's status to apply for the discount.
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="cta-section">
    <h2 class="cta-title">Ready to Get Started?</h2>
    <p class="cta-subtitle">Join thousands of developers who trust RapidTriageME for browser debugging</p>

    <div class="cta-buttons">
      <a href="/register" class="btn-cta btn-cta-primary">Start Free Trial</a>
      <a href="/support" class="btn-cta btn-cta-secondary">Talk to Sales</a>
    </div>
  </section>

  <script>
    let currentPricing = 'monthly';

    function togglePricing(type) {
      currentPricing = type;

      // Update toggle buttons
      document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');

      // Update prices
      document.querySelectorAll('.price').forEach(price => {
        if (price.dataset.monthly) {
          if (type === 'annual') {
            price.textContent = '$' + price.dataset.annual;
            const annualNote = price.parentElement.parentElement.querySelector('.price-annual');
            if (annualNote) annualNote.style.display = 'block';
          } else {
            price.textContent = '$' + price.dataset.monthly;
            const annualNote = price.parentElement.parentElement.querySelector('.price-annual');
            if (annualNote) annualNote.style.display = 'none';
          }
        }
      });
    }

    function selectPlan(plan) {
      window.location.href = '/register?plan=' + plan;
    }

    function contactSales() {
      window.location.href = '/support?subject=enterprise';
    }

    function toggleFAQ(element) {
      const item = element.parentElement;
      item.classList.toggle('active');
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
}