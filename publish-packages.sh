#!/bin/bash

# RapidTriageME NPM Package Publishing Script
# YarlisAISolutions

set -e

echo "🚀 RapidTriageME NPM Package Publisher"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if npm is logged in
echo "📋 Checking npm authentication..."
npm whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  You need to login to npm first${NC}"
    echo "Please run: npm login"
    exit 1
fi

NPM_USER=$(npm whoami)
echo -e "${GREEN}✅ Logged in as: $NPM_USER${NC}"
echo ""

# Function to publish a package
publish_package() {
    local dir=$1
    local package_name=$2
    
    echo -e "${YELLOW}📦 Publishing $package_name...${NC}"
    cd "$dir"
    
    # Check if package exists
    if npm view "$package_name" version &> /dev/null; then
        echo -e "${YELLOW}Package $package_name already exists on npm${NC}"
        echo "Current version: $(npm view $package_name version)"
        echo "Local version: $(node -p "require('./package.json').version")"
        read -p "Do you want to bump version and publish? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm version patch
        else
            echo "Skipping $package_name"
            return
        fi
    fi
    
    # Build the package
    echo "🔨 Building $package_name..."
    npm run build
    
    # Run tests if available
    echo "🧪 Running tests..."
    npm test
    
    # Publish with public access for scoped packages
    echo "📤 Publishing to npm..."
    npm publish --access public
    
    echo -e "${GREEN}✅ Successfully published $package_name!${NC}"
    echo ""
    
    cd ..
}

# Main execution
echo "🏗️ Preparing packages for publication..."
echo ""

# Navigate to project root
cd /Users/yarlis/Downloads/rapidtriageME

# Install dependencies and build for both packages
echo "📦 Installing dependencies..."

echo "Installing rapidtriage-mcp dependencies..."
cd rapidtriage-mcp
npm install
cd ..

echo "Installing rapidtriage-server dependencies..."
cd rapidtriage-server
npm install
cd ..

echo ""
echo "🚀 Starting publication process..."
echo ""

# Publish rapidtriage-server first (dependency for mcp)
publish_package "rapidtriage-server" "@yarlisai/rapidtriage-server"

# Publish rapidtriage-mcp
publish_package "rapidtriage-mcp" "@yarlisai/rapidtriage-mcp"

echo ""
echo "🎉 Publication Complete!"
echo "========================"
echo ""
echo "📦 Published packages:"
echo "  - @yarlisai/rapidtriage-server"
echo "  - @yarlisai/rapidtriage-mcp"
echo ""
echo "📚 Installation commands:"
echo -e "${GREEN}npx @yarlisai/rapidtriage-server@latest${NC}"
echo -e "${GREEN}npx @yarlisai/rapidtriage-mcp@latest${NC}"
echo ""
echo "🌐 Visit https://rapidtriage.me for documentation"
echo ""
echo "✨ YarlisAISolutions - Empowering AI-driven browser automation"