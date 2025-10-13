#!/bin/bash

echo "🚀 Testing RapidTriageME - Google Crypto Market Search"
echo "========================================================"
echo ""

BASE_URL="http://localhost:3025"
TARGET_URL="https://www.google.com"
SEARCH_QUERY="crypto market in 2025"

# Check health
echo "✅ Checking browser connector health..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Navigate to Google
echo "🌐 Navigating to Google.com..."
curl -X POST "$BASE_URL/navigate" \
  -H "Content-Type: application/json" \
  -d '{"url": "'"$TARGET_URL"'"}' \
  -s | jq '.'
echo ""

sleep 3

# Execute search
echo "🔍 Searching for 'crypto market in 2025'..."
SEARCH_SCRIPT='
const searchBox = document.querySelector("input[name=\"q\"], textarea[name=\"q\"], input[type=\"search\"]");
if (searchBox) {
    searchBox.value = "crypto market in 2025";
    searchBox.dispatchEvent(new Event("input", { bubbles: true }));
    const form = searchBox.closest("form");
    if (form) {
        const enterEvent = new KeyboardEvent("keydown", {
            key: "Enter",
            keyCode: 13,
            bubbles: true
        });
        searchBox.dispatchEvent(enterEvent);
        setTimeout(() => form.submit(), 100);
        return { success: true, message: "Search submitted", query: "crypto market in 2025" };
    }
    return { success: true, message: "Search box filled", value: searchBox.value };
}
return { success: false, message: "Search box not found" };
'

curl -X POST "$BASE_URL/execute" \
  -H "Content-Type: application/json" \
  -d "{\"script\": \"$SEARCH_SCRIPT\"}" \
  -s | jq '.'
echo ""

sleep 4

# Take screenshot
echo "📸 Taking screenshot..."
SCREENSHOT_RESPONSE=$(curl -X POST "$BASE_URL/screenshot" \
  -H "Content-Type: application/json" \
  -d '{"fullPage": false, "quality": 80}' \
  -s)

if [ ! -z "$SCREENSHOT_RESPONSE" ]; then
    echo "$SCREENSHOT_RESPONSE" | jq -r '.screenshot' | base64 -d > crypto-search-screenshot.png
    echo "✅ Screenshot saved to crypto-search-screenshot.png"
    echo "   Size: $(ls -lh crypto-search-screenshot.png | awk '{print $5}')"
fi
echo ""

# Get console logs
echo "📋 Getting console logs..."
curl -s "$BASE_URL/console" | jq '.logs | length' | xargs -I {} echo "   Found {} console logs"
curl -s "$BASE_URL/console" | jq '.logs[-3:][] | "\(.type): \(.text | .[0:80])"' 2>/dev/null
echo ""

# Get console errors
echo "🔴 Getting console errors..."
curl -s "$BASE_URL/console/errors" | jq '.errors | length' | xargs -I {} echo "   Found {} console errors"
curl -s "$BASE_URL/console/errors" | jq '.errors[-3:][] | .text | .[0:80]' 2>/dev/null
echo ""

# Get network logs
echo "🌐 Getting network logs..."
NETWORK_COUNT=$(curl -s "$BASE_URL/network" | jq '.requests | length')
echo "   Found $NETWORK_COUNT network requests"
echo "   Types:"
curl -s "$BASE_URL/network" | jq -r '.requests | group_by(.type) | .[] | "     - \(.[0].type): \(length) requests"' 2>/dev/null
echo ""

# Get network errors
echo "⚠️ Getting network errors..."
curl -s "$BASE_URL/network/errors" | jq '.errors | length' | xargs -I {} echo "   Found {} network errors"
echo ""

# Get page info
echo "📄 Getting page info..."
curl -s "$BASE_URL/page-info" | jq '.'
echo ""

# Run Lighthouse audits
echo "📊 Running Lighthouse audits (this may take a minute)..."
echo ""

echo "   ⚡ Performance..."
PERF_SCORE=$(curl -X POST "$BASE_URL/lighthouse/performance" -H "Content-Type: application/json" -d '{}' -s | jq '.score')
if [ "$PERF_SCORE" != "null" ]; then
    echo "   Performance Score: $(echo "scale=0; $PERF_SCORE * 100" | bc)/100"
fi

echo "   ♿ Accessibility..."
A11Y_SCORE=$(curl -X POST "$BASE_URL/lighthouse/accessibility" -H "Content-Type: application/json" -d '{}' -s | jq '.score')
if [ "$A11Y_SCORE" != "null" ]; then
    echo "   Accessibility Score: $(echo "scale=0; $A11Y_SCORE * 100" | bc)/100"
fi

echo "   🔍 SEO..."
SEO_SCORE=$(curl -X POST "$BASE_URL/lighthouse/seo" -H "Content-Type: application/json" -d '{}' -s | jq '.score')
if [ "$SEO_SCORE" != "null" ]; then
    echo "   SEO Score: $(echo "scale=0; $SEO_SCORE * 100" | bc)/100"
fi

echo "   📚 Best Practices..."
BP_SCORE=$(curl -X POST "$BASE_URL/lighthouse/best-practices" -H "Content-Type: application/json" -d '{}' -s | jq '.score')
if [ "$BP_SCORE" != "null" ]; then
    echo "   Best Practices Score: $(echo "scale=0; $BP_SCORE * 100" | bc)/100"
fi

echo ""
echo "========================================================"
echo "✅ Test Complete!"
echo "📸 Screenshot saved: crypto-search-screenshot.png"
echo "🔍 Search Query: '$SEARCH_QUERY'"
echo "📅 Test Date: $(date)"
echo "========================================================"