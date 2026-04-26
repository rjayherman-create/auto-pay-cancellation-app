# syntax=docker/dockerfile:1.4

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies
WORKDIR /app

# Copy only package files for dependency caching
COPY package*.json ./

# Install all dependencies
RUN npm ci --only=production


# Stage 2: Builder (for potential build steps)
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build tools if needed)
RUN npm ci

# Copy source code
COPY . .

# Verify app structure
RUN test -f server.js || (echo "server.js not found" && exit 1)


# Stage 3: Runtime
FROM node:18-alpine

# Install dumb-init and curl for health checks
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy pruned node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code from builder
COPY --from=builder --chown=nodejs:nodejs /app/server.js ./
COPY --from=builder --chown=nodejs:nodejs /app/routes ./routes
COPY --from=builder --chown=nodejs:nodejs /app/controllers ./controllers
COPY --from=builder --chown=nodejs:nodejs /app/middleware ./middleware
COPY --from=builder --chown=nodejs:nodejs /app/models ./models
COPY --from=builder --chown=nodejs:nodejs /app/services ./services
COPY --from=builder --chown=nodejs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nodejs:nodejs /app/seeders ./seeders
COPY --from=builder --chown=nodejs:nodejs /app/config ./config
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads && chmod 755 uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Use dumb-init to properly handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]
