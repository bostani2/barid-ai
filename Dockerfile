# syntax=docker/dockerfile:1.7

# ---------- base deps ----------
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

# ---------- deps install (cached) ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
# Prefer pnpm if lockfile exists, else fall back to npm
RUN if [ -f pnpm-lock.yaml ]; then pnpm i --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then corepack enable && yarn install --frozen-lockfile; \
    else npm i; fi

# ---------- builder ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build with Next.js (Turbopack is default via your script)
RUN if [ -f pnpm-lock.yaml ]; then pnpm run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f yarn.lock ]; then corepack enable && yarn build; \
    else npm run build; fi

# ---------- production runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Only copy necessary build artifacts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
