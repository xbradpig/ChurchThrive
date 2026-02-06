#!/bin/bash

# ChurchThrive Environment Setup Script
# This script helps set up the .env.local file from .env.example

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== ChurchThrive Environment Setup ===${NC}"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
    echo -e "${RED}Error: .env.example file not found${NC}"
    exit 1
fi

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}Warning: .env.local already exists${NC}"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Keeping existing .env.local${NC}"
        exit 0
    fi
fi

echo -e "${YELLOW}Creating .env.local from .env.example...${NC}"
cp .env.example .env.local

echo -e "\n${GREEN}Environment file created!${NC}"
echo -e "${YELLOW}Please edit .env.local and fill in your actual values:${NC}\n"

echo -e "${BLUE}Required variables:${NC}"
echo -e "  - NEXT_PUBLIC_SUPABASE_URL"
echo -e "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo -e "  - SUPABASE_SERVICE_ROLE_KEY"
echo -e "  - NEXT_PUBLIC_KAKAO_APP_KEY"
echo -e "  - NEXT_PUBLIC_FCM_VAPID_KEY"
echo -e "  - FCM_SERVER_KEY"

echo -e "\n${YELLOW}You can get these values from:${NC}"
echo -e "  - Supabase: https://app.supabase.com"
echo -e "  - Kakao: https://developers.kakao.com"
echo -e "  - Firebase: https://console.firebase.google.com"

echo -e "\n${GREEN}To set up GitHub Secrets for CI/CD:${NC}"
echo -e "1. Go to: https://github.com/YOUR_USERNAME/ChurchThrive/settings/secrets/actions"
echo -e "2. Add the following secrets:"
echo -e "   - NEXT_PUBLIC_SUPABASE_URL"
echo -e "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo -e "   - SUPABASE_SERVICE_ROLE_KEY"
echo -e "   - NEXT_PUBLIC_KAKAO_APP_KEY"
echo -e "   - NEXT_PUBLIC_FCM_VAPID_KEY"
echo -e "   - FCM_SERVER_KEY"
echo -e "   - CLOUDFLARE_API_TOKEN"
echo -e "   - CLOUDFLARE_ACCOUNT_ID"
echo -e "   - EXPO_TOKEN (for mobile builds)"

echo -e "\n${GREEN}To set up Cloudflare Pages environment variables:${NC}"
echo -e "1. Go to: https://dash.cloudflare.com"
echo -e "2. Navigate to: Workers & Pages > churchthrive > Settings > Environment variables"
echo -e "3. Add the same variables as GitHub Secrets"

echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Edit .env.local with your actual values"
echo -e "2. Set up GitHub Secrets"
echo -e "3. Set up Cloudflare Pages environment variables"
echo -e "4. Run: npm run dev:web (to test locally)"
echo -e "5. Run: ./scripts/deploy-web.sh (to deploy)"
