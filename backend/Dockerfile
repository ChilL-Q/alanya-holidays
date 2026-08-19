FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile

COPY shared ./shared
COPY backend ./backend

RUN pnpm --filter @alanya-holidays/shared build
RUN pnpm --filter @alanya-holidays/backend build

EXPOSE 4000
CMD ["node", "backend/dist/src/main.js"]
