# Multi-stage build for production optimization
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Production dependencies stage
FROM base AS dependencies
RUN pnpm install --frozen-lockfile --production

# Development dependencies stage for build
FROM base AS build-deps
RUN pnpm install --frozen-lockfile

# Build stage
FROM build-deps AS build
COPY . .
RUN pnpm run build
RUN pnpm run lint

# Production stage
FROM node:20-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/package.json ./

# Copy configuration files
COPY --from=build /app/.env.example ./.env.example

# Create data directory with proper permissions
RUN mkdir -p /app/data/backups /app/data/exports
RUN chown -R appuser:nodejs /app/data

# Create logs directory
RUN mkdir -p /app/logs
RUN chown -R appuser:nodejs /app/logs

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { \
    if (res.statusCode === 200) process.exit(0); else process.exit(1); \
  }).on('error', () => process.exit(1))"

# Production optimizations
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Start the application
CMD ["node", "server/index.js"]