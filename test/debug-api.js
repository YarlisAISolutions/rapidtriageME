#!/usr/bin/env node

const config = require('./config/test.config');
const fetch = require('./utils/fetch');

async function debugTest() {
  console.log('Config:', {
    baseUrl: config.api.baseUrl,
    token: config.api.token.substring(0, 20) + '...',
    environment: config.environment
  });
  
  const url = config.getApiUrl('/health');
  console.log('Testing URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: config.getHeaders()
    });
    
    console.log('Response:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    });
    
    const data = await response.json();
    console.log('Data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

debugTest();