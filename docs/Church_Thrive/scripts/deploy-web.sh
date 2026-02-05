#!/bin/bash

# ChurchThrive Web Deployment Script
# This script builds and deploys the Next.js app to Cloudflare Pages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== ChurchThrive Web Deployment ===${NC}"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}Error: .env.local file not found${NC}"
    echo -e "${YELLOW}Run ./scripts/setup-env.sh first${NC}"
    exit 1
fi

# Load environment variables
set -a
source .env.local
set +a

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm ci

echo -e "${YELLOW}Step 2: Building shared package...${NC}"
npm run build:shared

echo -e "${YELLOW}Step 3: Running type check...${NC}"
npm run typecheck

echo -e "${YELLOW}Step 4: Running linter...${NC}"
npm run lint

echo -e "${YELLOW}Step 5: Building Next.js app...${NC}"
npm run build:web

echo -e "${YELLOW}Step 6: Deploying to Cloudflare Pages...${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Wrangler CLI not found. Installing...${NC}"
    npm install -g wrangler
fi

# Deploy using wrangler
wrangler pages deploy app/.next --project-name=churchthrive

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "${GREEN}Your site should be live at: https://churchthrive.pages.dev${NC}"
echo -e "${GREEN}Custom domain: https://churchthrive.kr${NC}"
