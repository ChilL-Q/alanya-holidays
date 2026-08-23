# Stage 1: Build & Prune
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy root workspace manifests & configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile

# Copy source files
COPY shared ./shared
COPY backend ./backend

# Build shared library and backend application
RUN pnpm --filter @alanya-holidays/shared build
RUN pnpm --filter @alanya-holidays/backend build

# Isolate production dependencies
RUN pnpm --filter @alanya-holidays/backend --prod --legacy deploy /app/deployed

# Stage 2: Hardened Minimal Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Create dedicated unprivileged user (UID/GID 10001 matching backup container)
RUN addgroup -g 10001 appgroup && \
    adduser -u 10001 -G appgroup -s /bin/sh -D appuser

# Copy production node_modules and built application with unprivileged ownership
COPY --from=builder --chown=appuser:appgroup /app/deployed/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/backend/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/backend/package.json ./package.json

USER appuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e 'fetch("http://127.0.0.1:4000/api/health").then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))'

CMD ["node", "dist/backend/src/main.js"]
