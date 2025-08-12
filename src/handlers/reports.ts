/**
 * Reports Handler for RapidTriageME
 * Serves test reports and provides report listing
 */

export class ReportsHandler {
  // @ts-ignore - Will be used for storage access in production
  private env: any;

  constructor(env: any) {
    this.env = env;
  }

  /**
   * List all available reports
   */
  async handleReportsList(_request: Request): Promise<Response> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Reports - RapidTriageME</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .header p {
      opacity: 0.9;
      font-size: 16px;
    }
    
    .content {
      padding: 40px;
    }
    
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 8px;
    }
    
    .info-box h3 {
      color: #2d3748;
      margin-bottom: 10px;
    }
    
    .info-box p {
      color: #718096;
      line-height: 1.6;
    }
    
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    
    .report-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .report-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      border-color: #667eea;
    }
    
    .report-date {
      font-size: 14px;
      color: #718096;
      margin-bottom: 10px;
    }
    
    .report-title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 15px;
    }
    
    .report-stats {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .stat {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 14px;
    }
    
    .stat-icon {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
    }
    
    .stat-icon.success { background: #28a745; }
    .stat-icon.danger { background: #dc3545; }
    .stat-icon.info { background: #17a2b8; }
    
    .report-actions {
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;
      border: none;
      cursor: pointer;
      flex: 1;
      text-align: center;
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-primary:hover {
      background: #5a67d8;
    }
    
    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }
    
    .btn-secondary:hover {
      background: #cbd5e0;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #718096;
    }
    
    .empty-state-icon {
      font-size: 64px;
      margin-bottom: 20px;
      opacity: 0.5;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #718096;
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .reports-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Test Reports</h1>
      <p>Browse and view comprehensive test execution reports</p>
    </div>
    
    <div class="content">
      <div class="info-box">
        <h3>📌 About Test Reports</h3>
        <p>
          Test reports are automatically generated after each test suite execution. 
          Each report contains detailed information about all test cases, including request/response data, 
          execution times, and success metrics. Reports are available in both HTML and JSON formats.
        </p>
      </div>
      
      <h2 style="color: #2d3748; margin-bottom: 20px;">Available Reports</h2>
      
      <div id="reports-container">
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <h3>No Reports Available</h3>
          <p style="margin-top: 10px;">Run the test suite to generate reports</p>
          <p style="margin-top: 20px; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 6px;">
            node test-lifecycle.js
          </p>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>RapidTriageME Test Reports | <a href="/" style="color: #667eea;">Back to Home</a></p>
    </div>
  </div>
  
  <script>
    // In production, this would fetch the list of reports from the server
    async function loadReports() {
      try {
        const response = await fetch('/api/reports/list');
        if (response.ok) {
          const reports = await response.json();
          displayReports(reports);
        }
      } catch (error) {
        console.error('Failed to load reports:', error);
      }
    }
    
    function displayReports(reports) {
      if (!reports || reports.length === 0) {
        return;
      }
      
      const container = document.getElementById('reports-container');
      const grid = document.createElement('div');
      grid.className = 'reports-grid';
      
      reports.forEach(report => {
        const card = document.createElement('div');
        card.className = 'report-card';
        card.innerHTML = \`
          <div class="report-date">\${new Date(report.timestamp).toLocaleString()}</div>
          <div class="report-title">Test Report #\${report.id}</div>
          <div class="report-stats">
            <div class="stat">
              <span class="stat-icon info">📊</span>
              <span>\${report.totalTests} tests</span>
            </div>
            <div class="stat">
              <span class="stat-icon success">✓</span>
              <span>\${report.passed} passed</span>
            </div>
            <div class="stat">
              <span class="stat-icon danger">✗</span>
              <span>\${report.failed} failed</span>
            </div>
          </div>
          <div class="report-actions">
            <a href="/reports/\${report.htmlFile}" class="btn btn-primary">View HTML</a>
            <a href="/reports/\${report.jsonFile}" class="btn btn-secondary">Download JSON</a>
          </div>
        \`;
        grid.appendChild(card);
      });
      
      container.innerHTML = '';
      container.appendChild(grid);
    }
    
    // Load reports on page load
    // loadReports();
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

  /**
   * Serve a specific report file
   */
  async handleReportFile(_request: Request, filename: string): Promise<Response> {
    // In production, this would serve the actual report files from storage
    // For now, return a placeholder response
    
    const isHtml = filename.endsWith('.html');
    const contentType = isHtml ? 'text/html' : 'application/json';
    
    return new Response(`Report file: ${filename} would be served here`, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  /**
   * Get list of reports via API
   */
  async handleReportsListAPI(_request: Request): Promise<Response> {
    // In production, this would read from storage
    // For now, return sample data
    const reports = [
      {
        id: '001',
        timestamp: new Date().toISOString(),
        totalTests: 30,
        passed: 28,
        failed: 2,
        htmlFile: 'test-report-2025-08-11T20-30-00.html',
        jsonFile: 'test-report-2025-08-11T20-30-00.json'
      }
    ];

    return new Response(JSON.stringify(reports), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}