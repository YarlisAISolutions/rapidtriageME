#!/bin/bash

# Test all user roles
echo "🔐 Testing All User Roles and Permissions"
echo "=========================================="

# Test users array
declare -a users=(
  "free@rapidtriage.me:FreeUser123!:Free User"
  "starter@rapidtriage.me:StarterUser123!:Starter User"
  "pro@rapidtriage.me:ProUser123!:Pro User"
  "enterprise@rapidtriage.me:EnterpriseUser123!:Enterprise User"
  "owner@rapidtriage.me:OrgOwner123!:Organization Owner"
  "admin@rapidtriage.me:OrgAdmin123!:Organization Admin"
  "developer@rapidtriage.me:OrgDev123!:Developer"
  "analyst@rapidtriage.me:OrgAnalyst123!:Analyst"
  "viewer@rapidtriage.me:OrgViewer123!:Viewer"
  "billing@rapidtriage.me:OrgBilling123!:Billing"
)

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test each user
for user_data in "${users[@]}"; do
  IFS=':' read -r email password role <<< "$user_data"

  echo -e "\n${YELLOW}Testing: $role${NC}"
  echo "----------------------------------------"

  # Create JSON file for login
  echo "{\"email\":\"$email\",\"password\":\"$password\"}" > /tmp/login.json

  # 1. Test Login
  echo "1. Login test..."
  response=$(curl -X POST https://rapidtriage.me/auth/login \
    -H "Content-Type: application/json" \
    -d @/tmp/login.json -s)

  # Extract token
  token=$(echo $response | jq -r '.token')

  if [ "$token" != "null" ] && [ -n "$token" ]; then
    echo -e "   ${GREEN}✓ Login successful${NC}"

    # Extract user info
    user_role=$(echo $response | jq -r '.user.role')
    plan=$(echo $response | jq -r '.user.subscription.plan')
    permissions=$(echo $response | jq -r '.user.permissions | length')

    echo "   Role: $user_role"
    echo "   Plan: $plan"
    echo "   Permissions: $permissions permissions"

    # 2. Test API Access
    echo -e "\n2. API Access tests..."

    # Test /api/profile
    profile_status=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $token" \
      https://rapidtriage.me/api/profile)

    if [ "$profile_status" == "200" ]; then
      echo -e "   ${GREEN}✓ /api/profile: $profile_status${NC}"
    else
      echo -e "   ${RED}✗ /api/profile: $profile_status${NC}"
    fi

    # Test /api/projects
    projects_status=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $token" \
      https://rapidtriage.me/api/projects)

    if [ "$projects_status" == "200" ]; then
      echo -e "   ${GREEN}✓ /api/projects: $projects_status${NC}"
    else
      echo -e "   ${RED}✗ /api/projects: $projects_status${NC}"
    fi

    # Test /api/workspaces
    workspaces_status=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $token" \
      https://rapidtriage.me/api/workspaces)

    if [ "$workspaces_status" == "200" ]; then
      echo -e "   ${GREEN}✓ /api/workspaces: $workspaces_status${NC}"
    else
      echo -e "   ${RED}✗ /api/workspaces: $workspaces_status${NC}"
    fi

    # Test /api/analytics
    analytics_status=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $token" \
      https://rapidtriage.me/api/analytics)

    if [ "$analytics_status" == "200" ]; then
      echo -e "   ${GREEN}✓ /api/analytics: $analytics_status${NC}"
    else
      echo -e "   ${RED}✗ /api/analytics: $analytics_status${NC}"
    fi

    # Test /api/organization
    org_status=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $token" \
      https://rapidtriage.me/api/organization)

    if [ "$org_status" == "200" ]; then
      echo -e "   ${GREEN}✓ /api/organization: $org_status${NC}"
    else
      echo -e "   ${RED}✗ /api/organization: $org_status${NC}"
    fi

    # 3. Test CRUD Operations
    echo -e "\n3. CRUD Operations..."

    # Test CREATE project
    create_response=$(curl -X POST https://rapidtriage.me/api/projects \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d '{"name":"Test Project","description":"Test"}' -s -o /dev/null -w "%{http_code}")

    if [ "$create_response" == "201" ]; then
      echo -e "   ${GREEN}✓ CREATE Project: $create_response${NC}"
    else
      echo -e "   ${RED}✗ CREATE Project: $create_response${NC}"
    fi

  else
    echo -e "   ${RED}✗ Login failed${NC}"
  fi
done

# Cleanup
rm -f /tmp/login.json

echo -e "\n=========================================="
echo -e "${GREEN}✓ All tests completed!${NC}"