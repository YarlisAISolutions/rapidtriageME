#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const REPORTS_DIR = path.join(__dirname, 'reports');

// Get the latest report
const files = fs.readdirSync(REPORTS_DIR)
  .filter(f => f.endsWith('.html') && f.startsWith('test-report-'))
  .sort()
  .reverse();

if (files.length === 0) {
  console.log('No HTML reports found');
  process.exit(1);
}

const latestReport = files[0];
const reportPath = path.join(REPORTS_DIR, latestReport);

// Create server
const server = http.createServer((req, res) => {
  // Serve the HTML report
  if (req.url === '/' || req.url === '/report') {
    const html = fs.readFileSync(reportPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
  // Serve screenshot images
  else if (req.url.startsWith('/test-') && req.url.endsWith('.png')) {
    const imagePath = path.join(REPORTS_DIR, req.url.substring(1));
    if (fs.existsSync(imagePath)) {
      const image = fs.readFileSync(imagePath);
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(image);
    } else {
      res.writeHead(404);
      res.end('Image not found');
    }
  }
  // Redirect to report
  else {
    res.writeHead(302, { 'Location': '/' });
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         📊 RapidTriageME Test Report Server                   ║
╚════════════════════════════════════════════════════════════════╝

  Server running at: http://localhost:${PORT}
  Serving report:    ${latestReport}
  
  Press Ctrl+C to stop the server
  
  Opening browser...
  `);
  
  // Auto-open browser
  const { exec } = require('child_process');
  const openCommand = process.platform === 'darwin' ? 'open' :
                     process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${openCommand} http://localhost:${PORT}`);
});