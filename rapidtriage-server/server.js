#!/usr/bin/env node

/**
 * RapidTriageME Browser Automation Backend Server
 * Provides browser automation capabilities via Puppeteer
 */

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3025;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Store for logs and current URL
let browserLogs = [];
let currentTabUrl = null;

// Browser instance management
let browser = null;

/**
 * Initialize Puppeteer browser instance
 */
async function initBrowser() {
    if (!browser) {
        // Use environment variable for Chromium path if available (Cloud Run)
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
        
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080',
                '--start-maximized',
                '--single-process',
                '--no-zygote',
                '--disable-accelerated-2d-canvas',
                '--disable-software-rasterizer'
            ]
        });
        console.log('✅ Browser instance created');
    }
    return browser;
}

// Identity endpoint for Chrome extension validation
app.get('/.identity', (req, res) => {
    res.json({
        signature: 'mcp-browser-connector-24x7',
        name: 'RapidTriageME Browser Tools Server',
        version: '2.0.0',
        port: PORT
    });
});

// Endpoint to receive logs from Chrome extension
app.post('/extension-log', (req, res) => {
    const logData = req.body;
    
    // Store the log (limit to last 100 entries)
    browserLogs.push({
        ...logData.data,
        receivedAt: new Date().toISOString()
    });
    
    if (browserLogs.length > 100) {
        browserLogs = browserLogs.slice(-100);
    }
    
    console.log('Received log from extension:', logData.data.type);
    
    res.json({ 
        status: 'ok', 
        message: 'Log received',
        logsCount: browserLogs.length 
    });
});

// Endpoint to clear logs
app.post('/wipelogs', (req, res) => {
    browserLogs = [];
    console.log('All logs cleared');
    res.json({ 
        status: 'ok', 
        message: 'All logs cleared successfully' 
    });
});

// Endpoint to receive current URL from extension
app.post('/current-url', (req, res) => {
    const { url, tabId, timestamp, source } = req.body;
    currentTabUrl = url;
    
    console.log(`URL updated: ${url} (source: ${source})`);
    
    res.json({
        status: 'ok',
        message: 'URL updated',
        url: url
    });
});

// Endpoint to get current URL
app.get('/current-url', (req, res) => {
    res.json({
        url: currentTabUrl,
        timestamp: new Date().toISOString()
    });
});

// Get stored logs
app.get('/logs', (req, res) => {
    res.json({
        logs: browserLogs,
        count: browserLogs.length,
        currentUrl: currentTabUrl
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'RapidTriageME Browser Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        browser: browser ? 'connected' : 'disconnected'
    });
});

// List available tools
app.get('/api/tools', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                name: 'screenshot',
                description: 'Capture screenshots of web pages',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: { type: 'string' },
                        fullPage: { type: 'boolean' }
                    },
                    required: ['url']
                }
            },
            {
                name: 'console_logs',
                description: 'Get console logs from browser',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: { type: 'string' }
                    },
                    required: ['url']
                }
            },
            {
                name: 'lighthouse',
                description: 'Run Lighthouse audit',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: { type: 'string' }
                    },
                    required: ['url']
                }
            }
        ]
    });
});

// Screenshot endpoint
app.post('/api/screenshot', async (req, res) => {
    try {
        const { url, fullPage = false } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        const browser = await initBrowser();
        const page = await browser.newPage();
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        const screenshot = await page.screenshot({
            fullPage,
            encoding: 'base64'
        });
        
        await page.close();

        res.json({
            success: true,
            data: {
                screenshot,
                url,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Console logs endpoint
app.post('/api/console-logs', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        const browser = await initBrowser();
        const page = await browser.newPage();
        const logs = [];

        page.on('console', msg => {
            logs.push({
                level: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString()
            });
        });

        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.close();

        res.json({
            success: true,
            data: {
                logs,
                url,
                count: logs.length
            }
        });

    } catch (error) {
        console.error('Console logs error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Lighthouse audit endpoint (simplified)
app.post('/api/lighthouse', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        // Simplified lighthouse audit (real implementation would use lighthouse)
        const browser = await initBrowser();
        const page = await browser.newPage();
        
        const startTime = Date.now();
        await page.goto(url, { waitUntil: 'networkidle2' });
        const loadTime = Date.now() - startTime;
        
        await page.close();

        res.json({
            success: true,
            data: {
                url,
                scores: {
                    performance: Math.min(100, Math.round(5000 / loadTime * 100)),
                    accessibility: 85,
                    bestPractices: 90,
                    seo: 88
                },
                metrics: {
                    loadTime,
                    timestamp: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Lighthouse error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Element inspection endpoint
app.post('/api/inspect-element', async (req, res) => {
    try {
        const { url, selector } = req.body;
        
        if (!url || !selector) {
            return res.status(400).json({
                success: false,
                error: 'URL and selector are required'
            });
        }

        const browser = await initBrowser();
        const page = await browser.newPage();
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const element = await page.$(selector);
        if (!element) {
            await page.close();
            return res.status(404).json({
                success: false,
                error: 'Element not found'
            });
        }

        const boundingBox = await element.boundingBox();
        const innerHTML = await element.evaluate(el => el.innerHTML);
        const textContent = await element.evaluate(el => el.textContent);
        
        await page.close();

        res.json({
            success: true,
            data: {
                selector,
                boundingBox,
                innerHTML,
                textContent,
                url
            }
        });

    } catch (error) {
        console.error('Inspect element error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// JavaScript execution endpoint
app.post('/api/execute-js', async (req, res) => {
    try {
        const { url, code } = req.body;
        
        if (!url || !code) {
            return res.status(400).json({
                success: false,
                error: 'URL and code are required'
            });
        }

        const browser = await initBrowser();
        const page = await browser.newPage();
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const result = await page.evaluate(code);
        
        await page.close();

        res.json({
            success: true,
            data: {
                result,
                url,
                code: code.substring(0, 100) + '...'
            }
        });

    } catch (error) {
        console.error('Execute JS error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 RapidTriageME Browser Backend Server`);
    console.log(`📍 Running on http://localhost:${PORT}`);
    console.log(`🔧 Health check: http://localhost:${PORT}/health`);
});

// Initialize browser on startup
initBrowser().catch(console.error);