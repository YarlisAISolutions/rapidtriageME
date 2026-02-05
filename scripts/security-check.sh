#!/bin/bash
# =============================================================================
# RapidTriageME Security Check Script
# Run this before every deployment to ensure security requirements are met
# =============================================================================

# Don't use set -e as we handle errors ourselves

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "   RapidTriageME Security Check"
echo "=============================================="
echo ""

PASSED=0
FAILED=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    PASSED=$((PASSED + 1))
}

check_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    FAILED=$((FAILED + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
    WARNINGS=$((WARNINGS + 1))
}

# -----------------------------------------------------------------------------
# 1. Check for exposed secrets in code
# -----------------------------------------------------------------------------
echo "1. Checking for exposed secrets in source code..."

SECRETS_PATTERN="sk_live_[a-zA-Z0-9]{20,}|sk_test_[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{33}|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|-----BEGIN (RSA |EC )?PRIVATE KEY-----|password\s*=\s*['\"][^'\"]{8,}['\"]"

if grep -rE "$SECRETS_PATTERN" \
    --include="*.ts" \
    --include="*.js" \
    --include="*.tsx" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=lib \
    --exclude-dir=dist \
    "$PROJECT_ROOT/functions/src" \
    "$PROJECT_ROOT/rapidtriage-mcp" \
    "$PROJECT_ROOT/rapidtriage-server" 2>/dev/null; then
    check_fail "Possible secrets found in source code!"
else
    check_pass "No secrets found in source code"
fi

# -----------------------------------------------------------------------------
# 2. Check .gitignore for sensitive files
# -----------------------------------------------------------------------------
echo ""
echo "2. Checking .gitignore configuration..."

GITIGNORE="$PROJECT_ROOT/.gitignore"
REQUIRED_IGNORES=(".env" ".env.local" "credentials.json" "service-account" "*.pem" "*.key")
MISSING_IGNORES=()

for pattern in "${REQUIRED_IGNORES[@]}"; do
    if ! grep -q "$pattern" "$GITIGNORE" 2>/dev/null; then
        MISSING_IGNORES+=("$pattern")
    fi
done

if [ ${#MISSING_IGNORES[@]} -eq 0 ]; then
    check_pass ".gitignore contains required patterns"
else
    check_warn "Missing patterns in .gitignore: ${MISSING_IGNORES[*]}"
fi

# -----------------------------------------------------------------------------
# 3. Check that .env files are not tracked
# -----------------------------------------------------------------------------
echo ""
echo "3. Checking for tracked .env files..."

TRACKED_ENV=$(git -C "$PROJECT_ROOT" ls-files '*.env' '.env*' 2>/dev/null | grep -v ".env.example" || true)
if [ -n "$TRACKED_ENV" ]; then
    check_fail "Found tracked .env files: $TRACKED_ENV"
else
    check_pass "No .env files are tracked in git"
fi

# -----------------------------------------------------------------------------
# 4. NPM Audit - Functions
# -----------------------------------------------------------------------------
echo ""
echo "4. Running npm audit on functions..."

cd "$PROJECT_ROOT/functions"
AUDIT_RESULT=$(npm audit --audit-level=high 2>&1) || true
if echo "$AUDIT_RESULT" | grep -q "found 0 vulnerabilities"; then
    check_pass "Functions: 0 high/critical vulnerabilities"
else
    HIGH_COUNT=$(echo "$AUDIT_RESULT" | grep -oE "[0-9]+ high" | head -1 || echo "")
    CRITICAL_COUNT=$(echo "$AUDIT_RESULT" | grep -oE "[0-9]+ critical" | head -1 || echo "")
    if [ -n "$HIGH_COUNT" ] || [ -n "$CRITICAL_COUNT" ]; then
        check_fail "Functions: Found vulnerabilities - $HIGH_COUNT $CRITICAL_COUNT"
    else
        check_pass "Functions: No high/critical vulnerabilities"
    fi
fi

# -----------------------------------------------------------------------------
# 5. NPM Audit - MCP Server
# -----------------------------------------------------------------------------
echo ""
echo "5. Running npm audit on rapidtriage-mcp..."

cd "$PROJECT_ROOT/rapidtriage-mcp"
AUDIT_RESULT=$(npm audit --audit-level=high 2>&1) || true
if echo "$AUDIT_RESULT" | grep -q "found 0 vulnerabilities"; then
    check_pass "MCP Server: 0 high/critical vulnerabilities"
else
    check_fail "MCP Server: Vulnerabilities found"
fi

# -----------------------------------------------------------------------------
# 6. NPM Audit - Browser Server
# -----------------------------------------------------------------------------
echo ""
echo "6. Running npm audit on rapidtriage-server..."

cd "$PROJECT_ROOT/rapidtriage-server"
AUDIT_RESULT=$(npm audit --audit-level=high 2>&1) || true
if echo "$AUDIT_RESULT" | grep -q "found 0 vulnerabilities"; then
    check_pass "Browser Server: 0 high/critical vulnerabilities"
else
    check_fail "Browser Server: Vulnerabilities found"
fi

# -----------------------------------------------------------------------------
# 7. Build Check
# -----------------------------------------------------------------------------
echo ""
echo "7. Running build check..."

cd "$PROJECT_ROOT/functions"
if npm run build > /dev/null 2>&1; then
    check_pass "Functions build successful"
else
    check_fail "Functions build failed"
fi

# -----------------------------------------------------------------------------
# 8. Test Check
# -----------------------------------------------------------------------------
echo ""
echo "8. Running tests..."

cd "$PROJECT_ROOT/functions"
if npm test > /dev/null 2>&1; then
    check_pass "All tests passed"
else
    check_fail "Tests failed"
fi

# -----------------------------------------------------------------------------
# 9. Check for dangerous patterns
# -----------------------------------------------------------------------------
echo ""
echo "9. Checking for dangerous code patterns..."

# Check for eval with variables (potential injection)
EVAL_PATTERN="eval\s*\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\)"
if grep -rE "$EVAL_PATTERN" \
    --include="*.ts" \
    --include="*.js" \
    --exclude-dir=node_modules \
    --exclude-dir=lib \
    --exclude-dir=test \
    "$PROJECT_ROOT/functions/src" 2>/dev/null; then
    check_warn "Found eval() usage - verify it's intentional (debugger feature)"
else
    check_pass "No dangerous eval() patterns in functions"
fi

# -----------------------------------------------------------------------------
# 10. Check Firebase rules exist
# -----------------------------------------------------------------------------
echo ""
echo "10. Checking security rules..."

if [ -f "$PROJECT_ROOT/firestore.rules" ]; then
    check_pass "Firestore rules file exists"
else
    check_fail "Firestore rules file missing"
fi

if [ -f "$PROJECT_ROOT/storage.rules" ]; then
    check_pass "Storage rules file exists"
else
    check_fail "Storage rules file missing"
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "   Security Check Summary"
echo "=============================================="
echo -e "  ${GREEN}Passed${NC}:   $PASSED"
echo -e "  ${RED}Failed${NC}:   $FAILED"
echo -e "  ${YELLOW}Warnings${NC}: $WARNINGS"
echo "=============================================="

if [ $FAILED -gt 0 ]; then
    echo ""
    echo -e "${RED}DEPLOYMENT BLOCKED: Fix $FAILED security issue(s) before deploying${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}DEPLOYMENT ALLOWED: $WARNINGS warning(s) should be reviewed${NC}"
    exit 0
else
    echo ""
    echo -e "${GREEN}DEPLOYMENT APPROVED: All security checks passed${NC}"
    exit 0
fi
