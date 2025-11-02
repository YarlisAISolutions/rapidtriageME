// RapidTriageME Server Configuration
// Load configuration from environment variables with fallbacks

require('dotenv').config();
const path = require('path');
const os = require('os');
const fs = require('fs');

// Try to load config.json from parent directory
let jsonConfig = {};
const configPath = path.join(__dirname, '..', 'config.json');
if (fs.existsSync(configPath)) {
    try {
        jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('✓ Loaded configuration from config.json');
    } catch (error) {
        console.warn('⚠ Failed to parse config.json:', error.message);
    }
}

const config = {
    // Server configuration
    server: {
        port: parseInt(process.env.PORT || jsonConfig.server?.port || 3025, 10),
        host: process.env.SERVER_HOST || jsonConfig.server?.host || 'localhost',
        name: process.env.SERVER_NAME || jsonConfig.server?.name || 'RapidTriageME Browser Tools Server',
        version: process.env.SERVER_VERSION || jsonConfig.server?.version || '2.0.0',
        signature: 'mcp-browser-connector-24x7'
    },
    
    // Browser configuration
    browser: {
        headless: process.env.BROWSER_HEADLESS !== 'false',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || jsonConfig.browser?.executablePath || undefined
    },
    
    // Screenshots
    screenshots: {
        directory: process.env.SCREENSHOTS_DIR || 
                   jsonConfig.screenshots?.directory || 
                   path.join(os.homedir(), 'RapidTriage_Screenshots')
    },
    
    // CORS origins
    cors: {
        origins: process.env.CORS_ORIGINS ? 
                 process.env.CORS_ORIGINS.split(',') : 
                 (jsonConfig.cors?.origins || [
                     'http://localhost:3000',
                     'http://localhost:3001',
                     'http://localhost:5000',
                     'chrome-extension://*'
                 ])
    },
    
    // Environment
    environment: process.env.NODE_ENV || jsonConfig.environment || 'development',
    
    // Logging
    logLevel: process.env.LOG_LEVEL || jsonConfig.logLevel || 'info'
};

// Ensure screenshots directory exists
if (!fs.existsSync(config.screenshots.directory)) {
    fs.mkdirSync(config.screenshots.directory, { recursive: true });
    console.log('✓ Created screenshots directory:', config.screenshots.directory);
}

module.exports = config;

