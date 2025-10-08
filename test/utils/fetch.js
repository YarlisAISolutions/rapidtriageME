/**
 * Fetch compatibility wrapper for tests
 * Uses https module for compatibility
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Create headers object with get() method for compatibility
        const headers = {
          ...res.headers,
          get: function(name) {
            return this[name.toLowerCase()];
          }
        };
        
        const response = {
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: headers,
          json: async () => {
            try {
              return JSON.parse(data);
            } catch (e) {
              throw new Error('Invalid JSON response');
            }
          },
          text: async () => data
        };
        resolve(response);
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      const bodyData = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body);
      req.write(bodyData);
    }
    
    req.end();
  });
}

module.exports = fetch;