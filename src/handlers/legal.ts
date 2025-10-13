/**
 * Legal Pages Handler for RapidTriageME
 * Terms of Service, Privacy Policy, and other legal documents
 */

export class LegalHandler {
  async handleLegal(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
      case '/terms':
        return this.termsOfService();
      case '/privacy':
        return this.privacyPolicy();
      case '/cookies':
        return this.cookiePolicy();
      case '/dpa':
        return this.dataProcessingAgreement();
      case '/aup':
        return this.acceptableUsePolicy();
      default:
        return new Response('Legal document not found', { status: 404 });
    }
  }

  private generateLegalPage(title: string, content: string, path?: string): Response {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - RapidTriageME</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f7fafc;
      line-height: 1.6;
    }

    .header {
      background: linear-gradient(135deg, #667eea, #764ba2);
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
    }

    .legal-container {
      max-width: 900px;
      margin: 50px auto;
      padding: 0 20px;
    }

    .legal-header {
      text-align: center;
      margin-bottom: 50px;
    }

    .legal-title {
      font-size: 42px;
      color: #2d3748;
      margin-bottom: 10px;
    }

    .legal-updated {
      color: #718096;
      font-size: 16px;
    }

    .legal-content {
      background: white;
      border-radius: 16px;
      padding: 50px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
    }

    .legal-content h2 {
      font-size: 24px;
      color: #2d3748;
      margin: 30px 0 15px;
      padding-top: 20px;
    }

    .legal-content h3 {
      font-size: 20px;
      color: #4a5568;
      margin: 20px 0 10px;
    }

    .legal-content p {
      color: #4a5568;
      margin-bottom: 15px;
    }

    .legal-content ul, .legal-content ol {
      margin: 15px 0 15px 30px;
      color: #4a5568;
    }

    .legal-content li {
      margin-bottom: 8px;
    }

    .legal-content a {
      color: #667eea;
      text-decoration: none;
    }

    .legal-content a:hover {
      text-decoration: underline;
    }

    .legal-nav {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .legal-nav-title {
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 15px;
    }

    .legal-nav-links {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }

    .legal-nav-links a {
      color: #667eea;
      text-decoration: none;
      padding: 8px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .legal-nav-links a:hover,
    .legal-nav-links a.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-content">
      <a href="/" class="logo">🚀 RapidTriageME</a>
      <nav class="nav-menu">
        <a href="/features">Features</a>
        <a href="/pricing">Pricing</a>
        <a href="/docs">Docs</a>
        <a href="/login">Sign In</a>
      </nav>
    </div>
  </div>

  <div class="legal-container">
    <div class="legal-nav">
      <div class="legal-nav-title">Legal Documents</div>
      <div class="legal-nav-links">
        <a href="/terms" class="${path === '/terms' ? 'active' : ''}">Terms of Service</a>
        <a href="/privacy" class="${path === '/privacy' ? 'active' : ''}">Privacy Policy</a>
        <a href="/cookies" class="${path === '/cookies' ? 'active' : ''}">Cookie Policy</a>
        <a href="/dpa" class="${path === '/dpa' ? 'active' : ''}">Data Processing Agreement</a>
        <a href="/aup" class="${path === '/aup' ? 'active' : ''}">Acceptable Use Policy</a>
      </div>
    </div>

    <div class="legal-header">
      <h1 class="legal-title">${title}</h1>
      <p class="legal-updated">Last updated: January 9, 2025</p>
    </div>

    <div class="legal-content">
      ${content}
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }

  private termsOfService(): Response {
    const content = `
      <h2>1. Agreement to Terms</h2>
      <p>By accessing or using RapidTriageME ("Service"), operated by YarlisAISolutions ("Company", "we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the Service.</p>

      <h2>2. Description of Service</h2>
      <p>RapidTriageME is a browser debugging and automation platform that provides:</p>
      <ul>
        <li>Real-time browser debugging capabilities</li>
        <li>Screenshot capture and analysis</li>
        <li>Network monitoring and logging</li>
        <li>Performance auditing tools</li>
        <li>API access for programmatic interaction</li>
      </ul>

      <h2>3. Account Registration</h2>
      <p>To use certain features of the Service, you must register for an account. You agree to:</p>
      <ul>
        <li>Provide accurate, current, and complete information</li>
        <li>Maintain and promptly update your account information</li>
        <li>Maintain the security of your password and account</li>
        <li>Accept responsibility for all activities under your account</li>
        <li>Notify us immediately of any unauthorized use</li>
      </ul>

      <h2>4. Subscription Plans and Payment</h2>
      <h3>4.1 Plans</h3>
      <p>We offer various subscription plans with different features and usage limits. Current plans include Free, Professional, and Enterprise tiers.</p>

      <h3>4.2 Billing</h3>
      <p>For paid subscriptions:</p>
      <ul>
        <li>Billing occurs on a monthly or annual basis</li>
        <li>All fees are non-refundable except as required by law</li>
        <li>Prices are subject to change with 30 days notice</li>
        <li>You are responsible for all applicable taxes</li>
      </ul>

      <h3>4.3 Cancellation</h3>
      <p>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period.</p>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any illegal or unauthorized purpose</li>
        <li>Attempt to breach or circumvent any security measures</li>
        <li>Interfere with or disrupt the Service or servers</li>
        <li>Transmit viruses, malware, or harmful code</li>
        <li>Scrape or harvest data without permission</li>
        <li>Exceed usage limits of your subscription plan</li>
        <li>Resell or redistribute the Service without authorization</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>The Service and its original content, features, and functionality are owned by YarlisAISolutions and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>

      <h2>7. Privacy and Data Protection</h2>
      <p>Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as detailed in the Privacy Policy.</p>

      <h2>8. API Usage</h2>
      <p>If you use our API:</p>
      <ul>
        <li>You must comply with rate limits and usage restrictions</li>
        <li>You must not use the API to compete with the Service</li>
        <li>We may revoke API access for violations of these Terms</li>
        <li>API availability is not guaranteed and may change</li>
      </ul>

      <h2>9. Limitation of Liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, YARLISAISOLUTIONS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.</p>

      <h2>10. Disclaimer of Warranties</h2>
      <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>

      <h2>11. Indemnification</h2>
      <p>You agree to indemnify, defend, and hold harmless YarlisAISolutions and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising from your use of the Service or violation of these Terms.</p>

      <h2>12. Changes to Terms</h2>
      <p>We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the modified Terms.</p>

      <h2>13. Termination</h2>
      <p>We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms.</p>

      <h2>14. Governing Law</h2>
      <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.</p>

      <h2>15. Contact Information</h2>
      <p>For questions about these Terms, please contact us at:</p>
      <ul>
        <li>Email: legal@rapidtriage.me</li>
        <li>Website: https://rapidtriage.me/support</li>
      </ul>
    `;

    return this.generateLegalPage('Terms of Service', content);
  }

  private privacyPolicy(): Response {
    const content = `
      <h2>1. Information We Collect</h2>
      <h3>1.1 Information You Provide</h3>
      <ul>
        <li>Account information (name, email, company)</li>
        <li>Payment information (processed securely via Stripe)</li>
        <li>Content you upload or create using the Service</li>
        <li>Communications with us</li>
      </ul>

      <h3>1.2 Information Collected Automatically</h3>
      <ul>
        <li>Usage data and analytics</li>
        <li>Device and browser information</li>
        <li>IP address and location data</li>
        <li>Cookies and similar technologies</li>
      </ul>

      <h2>2. How We Use Information</h2>
      <p>We use collected information to:</p>
      <ul>
        <li>Provide, maintain, and improve the Service</li>
        <li>Process transactions and send related information</li>
        <li>Send technical notices and support messages</li>
        <li>Respond to your comments and questions</li>
        <li>Monitor and analyze trends and usage</li>
        <li>Detect and prevent fraudulent activity</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>3. Information Sharing</h2>
      <p>We do not sell or rent your personal information. We may share information:</p>
      <ul>
        <li>With service providers who assist in our operations</li>
        <li>To comply with legal obligations</li>
        <li>To protect rights, privacy, safety, or property</li>
        <li>With your consent or at your direction</li>
        <li>In connection with a business transfer or acquisition</li>
      </ul>

      <h2>4. Data Security</h2>
      <p>We implement appropriate technical and organizational measures to protect your information, including:</p>
      <ul>
        <li>Encryption of data in transit and at rest</li>
        <li>Regular security assessments</li>
        <li>Access controls and authentication</li>
        <li>Employee training on data protection</li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>We retain your information for as long as necessary to provide the Service and fulfill the purposes outlined in this Policy. Retention periods vary based on the type of data and subscription plan.</p>

      <h2>6. Your Rights</h2>
      <p>Depending on your location, you may have rights including:</p>
      <ul>
        <li>Access to your personal information</li>
        <li>Correction of inaccurate data</li>
        <li>Deletion of your information</li>
        <li>Data portability</li>
        <li>Objection to certain processing</li>
        <li>Withdrawal of consent</li>
      </ul>

      <h2>7. Cookies and Tracking</h2>
      <p>We use cookies and similar technologies for:</p>
      <ul>
        <li>Authentication and security</li>
        <li>Preferences and settings</li>
        <li>Analytics and performance</li>
        <li>Marketing and advertising (with consent)</li>
      </ul>

      <h2>8. International Data Transfers</h2>
      <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.</p>

      <h2>9. Children's Privacy</h2>
      <p>The Service is not intended for users under 16 years of age. We do not knowingly collect information from children under 16.</p>

      <h2>10. Changes to Privacy Policy</h2>
      <p>We may update this Policy periodically. We will notify you of material changes via email or through the Service.</p>

      <h2>11. Contact Us</h2>
      <p>For privacy-related questions or requests:</p>
      <ul>
        <li>Email: privacy@rapidtriage.me</li>
        <li>Data Protection Officer: dpo@rapidtriage.me</li>
        <li>Address: YarlisAISolutions, Privacy Department</li>
      </ul>
    `;

    return this.generateLegalPage('Privacy Policy', content);
  }

  private cookiePolicy(): Response {
    const content = `
      <h2>1. What Are Cookies</h2>
      <p>Cookies are small text files placed on your device when you visit our website. They help us provide you with a better experience and allow certain features to work.</p>

      <h2>2. Types of Cookies We Use</h2>

      <h3>2.1 Essential Cookies</h3>
      <p>Required for the Service to function properly:</p>
      <ul>
        <li>Authentication cookies</li>
        <li>Security cookies</li>
        <li>Load balancing cookies</li>
      </ul>

      <h3>2.2 Functional Cookies</h3>
      <p>Enhance your experience:</p>
      <ul>
        <li>Language preferences</li>
        <li>User settings</li>
        <li>Theme preferences</li>
      </ul>

      <h3>2.3 Analytics Cookies</h3>
      <p>Help us understand usage:</p>
      <ul>
        <li>Page views and navigation</li>
        <li>Feature usage statistics</li>
        <li>Error tracking</li>
      </ul>

      <h3>2.4 Marketing Cookies</h3>
      <p>Used with your consent for:</p>
      <ul>
        <li>Targeted advertising</li>
        <li>Campaign effectiveness</li>
        <li>Remarketing</li>
      </ul>

      <h2>3. Cookie Management</h2>
      <p>You can control cookies through:</p>
      <ul>
        <li>Browser settings</li>
        <li>Our cookie preference center</li>
        <li>Opt-out tools for analytics and advertising</li>
      </ul>

      <h2>4. Third-Party Cookies</h2>
      <p>Some third-party services may set cookies:</p>
      <ul>
        <li>Stripe (payment processing)</li>
        <li>Google Analytics (usage analytics)</li>
        <li>Cloudflare (security and performance)</li>
      </ul>

      <h2>5. Updates to This Policy</h2>
      <p>We may update this Cookie Policy periodically. Changes will be posted on this page with an updated revision date.</p>
    `;

    return this.generateLegalPage('Cookie Policy', content);
  }

  private dataProcessingAgreement(): Response {
    const content = `
      <h2>1. Definitions</h2>
      <p>In this Data Processing Agreement ("DPA"):</p>
      <ul>
        <li>"Controller" means the entity that determines the purposes and means of processing</li>
        <li>"Processor" means RapidTriageME/YarlisAISolutions</li>
        <li>"Data Subject" means the individual to whom personal data relates</li>
        <li>"Personal Data" means information relating to an identified or identifiable person</li>
      </ul>

      <h2>2. Processing of Personal Data</h2>
      <p>Processor shall:</p>
      <ul>
        <li>Process Personal Data only on documented instructions from Controller</li>
        <li>Ensure persons authorized to process Personal Data are under confidentiality obligations</li>
        <li>Implement appropriate technical and organizational measures</li>
        <li>Assist Controller in responding to Data Subject requests</li>
      </ul>

      <h2>3. Security Measures</h2>
      <p>Processor implements:</p>
      <ul>
        <li>Pseudonymization and encryption of Personal Data</li>
        <li>Ongoing confidentiality, integrity, availability, and resilience</li>
        <li>Ability to restore availability and access in timely manner</li>
        <li>Regular testing and evaluation of security measures</li>
      </ul>

      <h2>4. Sub-processors</h2>
      <p>Controller authorizes Processor to engage sub-processors, provided:</p>
      <ul>
        <li>Processor maintains a list of sub-processors</li>
        <li>Processor notifies Controller of changes</li>
        <li>Sub-processors are bound by similar obligations</li>
      </ul>

      <h2>5. Data Subject Rights</h2>
      <p>Processor shall assist Controller in fulfilling obligations to respond to Data Subject requests for:</p>
      <ul>
        <li>Access to their Personal Data</li>
        <li>Rectification or erasure</li>
        <li>Restriction of processing</li>
        <li>Data portability</li>
      </ul>

      <h2>6. Data Breach Notification</h2>
      <p>Processor shall notify Controller without undue delay after becoming aware of a Personal Data breach, providing:</p>
      <ul>
        <li>Nature of the breach</li>
        <li>Categories and numbers of Data Subjects affected</li>
        <li>Likely consequences</li>
        <li>Measures taken or proposed</li>
      </ul>

      <h2>7. Audit Rights</h2>
      <p>Processor shall make available to Controller all information necessary to demonstrate compliance and allow for audits.</p>

      <h2>8. Data Deletion</h2>
      <p>Upon termination, Processor shall, at Controller's choice, delete or return all Personal Data and delete existing copies unless legally required to retain.</p>

      <h2>9. Liability</h2>
      <p>Each party's liability arising under this DPA shall be subject to the limitations set forth in the Terms of Service.</p>

      <h2>10. Governing Law</h2>
      <p>This DPA is governed by the same law as the Terms of Service.</p>
    `;

    return this.generateLegalPage('Data Processing Agreement', content);
  }

  private acceptableUsePolicy(): Response {
    const content = `
      <h2>1. Prohibited Uses</h2>
      <p>You may not use RapidTriageME to:</p>
      <ul>
        <li>Violate any laws or regulations</li>
        <li>Infringe intellectual property rights</li>
        <li>Transmit harmful, fraudulent, or deceptive content</li>
        <li>Compromise security or integrity of any system</li>
        <li>Engage in unauthorized data collection or harvesting</li>
        <li>Interfere with other users' access to the Service</li>
        <li>Attempt to gain unauthorized access to any systems</li>
        <li>Use the Service for crypto mining or similar activities</li>
        <li>Conduct vulnerability scans without permission</li>
        <li>Overwhelm the Service with excessive requests</li>
      </ul>

      <h2>2. Security Requirements</h2>
      <p>You must:</p>
      <ul>
        <li>Keep your credentials confidential</li>
        <li>Promptly report security vulnerabilities</li>
        <li>Not share API keys or access tokens</li>
        <li>Use strong, unique passwords</li>
        <li>Enable two-factor authentication when available</li>
      </ul>

      <h2>3. Resource Usage</h2>
      <p>You agree to:</p>
      <ul>
        <li>Respect rate limits and quotas</li>
        <li>Not circumvent usage restrictions</li>
        <li>Optimize API calls to minimize load</li>
        <li>Cache responses when appropriate</li>
      </ul>

      <h2>4. Content Standards</h2>
      <p>Content processed through the Service must not:</p>
      <ul>
        <li>Contain illegal material</li>
        <li>Include malware or viruses</li>
        <li>Violate privacy rights</li>
        <li>Contain hate speech or discrimination</li>
        <li>Include adult or explicit content</li>
      </ul>

      <h2>5. Enforcement</h2>
      <p>Violations may result in:</p>
      <ul>
        <li>Warning or temporary suspension</li>
        <li>Permanent account termination</li>
        <li>Legal action if warranted</li>
        <li>Reporting to law enforcement</li>
      </ul>

      <h2>6. Reporting Violations</h2>
      <p>To report AUP violations, contact:</p>
      <ul>
        <li>Email: abuse@rapidtriage.me</li>
        <li>Include evidence and details</li>
        <li>We investigate all credible reports</li>
      </ul>
    `;

    return this.generateLegalPage('Acceptable Use Policy', content);
  }
}