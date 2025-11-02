#!/bin/bash

# RapidTriageME Extension Reload Helper
# Provides instructions to reload the extension in Chrome

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

EXTENSION_ID="apmgcakokbocmcnioakggmjhjaiablci"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔄 RapidTriageME Extension Reload Helper${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${CYAN}Extension ID:${NC} $EXTENSION_ID"
echo -e "${CYAN}Extension URL:${NC} chrome://extensions/?id=$EXTENSION_ID"
echo ""

echo -e "${YELLOW}To reload the extension manually:${NC}"
echo ""
echo "1. Open: chrome://extensions/"
echo "2. Find: RapidTriage DevTools"
echo "3. Click the reload icon (🔄)"
echo ""
echo -e "${YELLOW}Or use this direct link:${NC}"
echo "   chrome://extensions/?id=$EXTENSION_ID"
echo ""

echo -e "${YELLOW}After reloading:${NC}"
echo "1. Close any open DevTools panels"
echo "2. Reopen DevTools (F12 or Cmd+Option+I)"
echo "3. Navigate to the 'RapidTriage' panel"
echo "4. Check connection status at the top"
echo ""

echo -e "${GREEN}✓ Extension reload instructions displayed${NC}"
echo ""

