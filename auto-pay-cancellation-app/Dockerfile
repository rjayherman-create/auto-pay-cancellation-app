# Multi-stage build for Production Studio

# Stage 1: Build frontend
FROM node:16-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./

# Build frontend
RUN npm run build

# Stage 2: Build backend & production image
FROM node:16-alpine

WORKDIR /app

# Install FFmpeg (required for video rendering)
RUN apk add --no-cache ffmpeg

# Copy backend package files
COPY package*.json ./
COPY backend ./backend

# Install production dependencies only
RUN npm ci --only=production

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create directories for uploads and projects
RUN mkdir -p uploads projects

# Expose ports
EXPOSE 5000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["npm", "start"]
