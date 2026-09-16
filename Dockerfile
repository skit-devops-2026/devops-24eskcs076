# ========================================================
# Dockerfile - CloudTask DevOps Platform
# Multi-Stage Production Build
# Course: DevOps Practices and Principles (CSUL511)
# Roll No: 24ESKCS076
# ========================================================

# --- Stage 1: Build & Test Stage ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency manifests
COPY package.json ./

# Copy application source & tests
COPY src/ ./src/
COPY test/ ./test/

# Run static syntax verification and automated tests inside container build
RUN npm run lint
RUN npm test

# --- Stage 2: Production Distroless/Minimal Runtime Stage ---
FROM node:20-alpine AS runner

LABEL org.opencontainers.image.title="CloudTask DevOps Platform" \
      org.opencontainers.image.description="Cloud-Native Task and Metrics Microservice" \
      org.opencontainers.image.authors="Ayush <24ESKCS076>" \
      org.opencontainers.image.source="https://github.com/skit-devops-2026/devops-24eskcs076"

WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Copy manifests and source from builder
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/src/ ./src/

# Security hardening: run as unprivileged non-root node user
USER node

# Expose microservice HTTP & metrics port
EXPOSE 3000

# Container healthcheck instruction
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server
CMD ["node", "src/server.js"]
