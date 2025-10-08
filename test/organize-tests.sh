#!/bin/bash

# Script to organize all test files into a proper structure
# This script will move and organize tests, removing duplicates

echo "🧪 Organizing RapidTriageME Test Suite"
echo "======================================"
echo ""

# Create the new test structure
echo "📁 Creating organized test structure..."

mkdir -p test/01-unit
mkdir -p test/02-api
mkdir -p test/03-browser
mkdir -p test/04-extension
mkdir -p test/05-integration
mkdir -p test/06-e2e
mkdir -p test/07-performance
mkdir -p test/08-security
mkdir -p test/utils
mkdir -p test/fixtures
mkdir -p test/reports
mkdir -p test/config

echo "✅ Test structure created"
echo ""

# Move API tests
echo "📋 Organizing API tests..."
mv test-all-apis.js test/02-api/all-apis.test.js 2>/dev/null
mv test-production-api.js test/02-api/production-api.test.js 2>/dev/null
mv test-auth-flow.js test/02-api/auth-flow.test.js 2>/dev/null
mv test-console-api.html test/02-api/console-api.test.html 2>/dev/null

# Move browser/automation tests
echo "📋 Organizing browser tests..."
mv test-browser-automation.js test/03-browser/browser-automation.test.js 2>/dev/null
mv test-devtools-buttons.js test/03-browser/devtools-buttons.test.js 2>/dev/null

# Move extension tests
echo "📋 Organizing extension tests..."
mv test-mcp-buttons.js test/04-extension/mcp-buttons.test.js 2>/dev/null
mv test-screenshot-upload.js test/04-extension/screenshot-upload.test.js 2>/dev/null
mv test-all-buttons.sh test/04-extension/all-buttons.test.sh 2>/dev/null

# Move integration tests
echo "📋 Organizing integration tests..."
mv test-both-modes.js test/05-integration/both-modes.test.js 2>/dev/null
mv test-lifecycle.js test/05-integration/lifecycle.test.js 2>/dev/null
mv test-profile-fix.html test/05-integration/profile-fix.test.html 2>/dev/null

# Move test-suite files
echo "📋 Organizing test-suite files..."
if [ -d "test-suite" ]; then
    # Move utils
    mv test-suite/assets/test-runner.js test/utils/test-runner.js 2>/dev/null
    mv test-suite/assets/test-utils.js test/utils/test-utils.js 2>/dev/null
    
    # Move HTML test files to fixtures
    find test-suite/archive -name "*.html" -exec mv {} test/fixtures/ \; 2>/dev/null
fi

# Move existing test folder contents
echo "📋 Merging existing test folder..."
if [ -d "test/validation" ]; then
    mv test/validation/*.js test/05-integration/ 2>/dev/null
fi

if [ -d "test/documentation" ]; then
    mv test/documentation/* test/config/ 2>/dev/null
fi

echo ""
echo "✅ Test organization complete!"
echo ""
echo "📊 Test Structure:"
echo "  test/"
echo "  ├── 01-unit/        # Unit tests for individual functions"
echo "  ├── 02-api/         # API endpoint tests"
echo "  ├── 03-browser/     # Browser automation tests"
echo "  ├── 04-extension/   # Chrome extension tests"
echo "  ├── 05-integration/ # Integration tests"
echo "  ├── 06-e2e/         # End-to-end tests"
echo "  ├── 07-performance/ # Performance tests"
echo "  ├── 08-security/    # Security tests"
echo "  ├── utils/          # Test utilities and helpers"
echo "  ├── fixtures/       # Test data and HTML fixtures"
echo "  ├── reports/        # Test reports output"
echo "  └── config/         # Test configuration"
echo ""