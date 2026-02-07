# ChurchThrive Web App - Multi-stage Dockerfile
# This provides an alternative deployment option using containers

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY app/package*.json ./app/

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/app/node_modules ./app/node_modules

# Copy source code
COPY . .

# Build shared package
RUN npm run build:shared

# Build Next.js app
RUN npm run build:web

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/app/public ./app/public
COPY --from=builder --chown=nextjs:nodejs /app/app/.next ./app/.next
COPY --from=builder /app/app/node_modules ./app/node_modules
COPY --from=builder /app/app/package.json ./app/package.json
COPY --from=builder /app/packages ./packages

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["npm", "run", "start", "--workspace=app"]
