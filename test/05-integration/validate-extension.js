#!/usr/bin/env node

/**
 * Extension Validation Script
 * Validates the RapidTriage Chrome extension structure and dependencies
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_DIR = './rapidtriage-extension';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(color, message) {
    console.log(`${color}${message}${RESET}`);
}

function checkFile(filePath, description) {
    const fullPath = path.join(EXTENSION_DIR, filePath);
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        log(GREEN, `✅ ${description}: ${filePath} (${stats.size} bytes)`);
        return true;
    } else {
        log(RED, `❌ ${description}: ${filePath} - FILE NOT FOUND`);
        return false;
    }
}

function validateJSON(filePath, description) {
    const fullPath = path.join(EXTENSION_DIR, filePath);
    try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const json = JSON.parse(content);
        log(GREEN, `✅ ${description}: Valid JSON`);
        return json;
    } catch (error) {
        log(RED, `❌ ${description}: Invalid JSON - ${error.message}`);
        return null;
    }
}

function validateHTML(filePath, description) {
    const fullPath = path.join(EXTENSION_DIR, filePath);
    try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('<!DOCTYPE html>') && content.includes('</html>')) {
            log(GREEN, `✅ ${description}: Valid HTML structure`);
            return true;
        } else {
            log(YELLOW, `⚠️ ${description}: Missing DOCTYPE or closing HTML tag`);
            return false;
        }
    } catch (error) {
        log(RED, `❌ ${description}: Cannot read file - ${error.message}`);
        return false;
    }
}

async function checkServerConnection() {
    try {
        const response = await fetch('http://localhost:3025/.identity');
        if (response.ok) {
            const data = await response.json();
            log(GREEN, `✅ Server Connection: ${data.name} v${data.version}`);
            return true;
        } else {
            log(RED, `❌ Server Connection: HTTP ${response.status}`);
            return false;
        }
    } catch (error) {
        log(RED, `❌ Server Connection: ${error.message}`);
        return false;
    }
}

async function main() {
    log(BLUE, '🔍 RapidTriage Extension Validation');
    log(BLUE, '=====================================');
    
    let allValid = true;
    
    // Check extension directory
    if (!fs.existsSync(EXTENSION_DIR)) {
        log(RED, `❌ Extension directory not found: ${EXTENSION_DIR}`);
        process.exit(1);
    }
    
    log(BLUE, '\n📁 File Structure Check:');
    allValid &= checkFile('manifest.json', 'Manifest');
    allValid &= checkFile('devtools.html', 'DevTools HTML');
    allValid &= checkFile('devtools.js', 'DevTools Script');
    allValid &= checkFile('panel.html', 'Panel HTML');
    allValid &= checkFile('background.js', 'Background Script');
    allValid &= checkFile('icon16.png', 'Icon 16x16');
    allValid &= checkFile('icon48.png', 'Icon 48x48');
    allValid &= checkFile('icon128.png', 'Icon 128x128');
    
    log(BLUE, '\n📋 Content Validation:');
    
    // Validate manifest.json
    const manifest = validateJSON('manifest.json', 'Manifest JSON');
    if (manifest) {
        log(GREEN, `   - Name: ${manifest.name}`);
        log(GREEN, `   - Version: ${manifest.version}`);
        log(GREEN, `   - Manifest Version: ${manifest.manifest_version}`);
        log(GREEN, `   - DevTools Page: ${manifest.devtools_page}`);
        
        if (manifest.devtools_page !== 'devtools.html') {
            log(RED, `   ❌ DevTools page should be 'devtools.html', found: ${manifest.devtools_page}`);
            allValid = false;
        }
        
        if (manifest.manifest_version !== 3) {
            log(RED, `   ❌ Should use Manifest V3, found: ${manifest.manifest_version}`);
            allValid = false;
        }
    }
    
    // Validate HTML files
    validateHTML('devtools.html', 'DevTools HTML');
    validateHTML('panel.html', 'Panel HTML');
    
    // Check JavaScript files
    const devtoolsJS = path.join(EXTENSION_DIR, 'devtools.js');
    if (fs.existsSync(devtoolsJS)) {
        const content = fs.readFileSync(devtoolsJS, 'utf8');
        if (content.includes('chrome.devtools.panels.create')) {
            log(GREEN, '✅ DevTools JS: Contains panel creation code');
        } else {
            log(RED, '❌ DevTools JS: Missing panel creation code');
            allValid = false;
        }
    }
    
    log(BLUE, '\n🌐 Server Connection Check:');
    const serverOK = await checkServerConnection();
    
    log(BLUE, '\n📊 Summary:');
    if (allValid && serverOK) {
        log(GREEN, '🎉 Extension is ready for Chrome! All validations passed.');
        log(GREEN, '   To load: chrome://extensions/ → Load unpacked → Select rapidtriage-extension/');
    } else if (allValid) {
        log(YELLOW, '⚠️ Extension files are valid, but server is not running.');
        log(YELLOW, '   Start server with: node rapidtriage-server/server.js');
    } else {
        log(RED, '❌ Extension has issues that need to be fixed.');
    }
    
    log(BLUE, '\n🔧 Chrome Loading Instructions:');
    log(BLUE, '1. Open chrome://extensions/');
    log(BLUE, '2. Enable "Developer mode" (top right)');
    log(BLUE, '3. Click "Load unpacked"');
    log(BLUE, `4. Select: ${path.resolve(EXTENSION_DIR)}`);
    log(BLUE, '5. Open any webpage');
    log(BLUE, '6. Press F12 (DevTools)');
    log(BLUE, '7. Look for "RapidTriage" tab');
    
    process.exit(allValid ? 0 : 1);
}

main().catch(console.error);