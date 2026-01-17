# 1. Base Image
FROM node:20-alpine AS base

# 2. Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 4. Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Force update tar, cross-spawn, and glob in global npm to fix CVEs
# We install globally first, then manually replace to bypass npm's internal dependency resolution during install
RUN npm install -g tar@^7.5.3 cross-spawn@^7.0.5 glob@^10.5.0 && \
    rm -rf /usr/local/lib/node_modules/npm/node_modules/tar \
    /usr/local/lib/node_modules/npm/node_modules/cross-spawn \
    /usr/local/lib/node_modules/npm/node_modules/glob && \
    cp -r /usr/local/lib/node_modules/tar /usr/local/lib/node_modules/npm/node_modules/ && \
    cp -r /usr/local/lib/node_modules/cross-spawn /usr/local/lib/node_modules/npm/node_modules/ && \
    cp -r /usr/local/lib/node_modules/glob /usr/local/lib/node_modules/npm/node_modules/ && \
    npm cache clean --force

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions for nextjs user
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
