FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ && corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN pnpm install --frozen-lockfile --config.minimum-release-age=0 \
 || pnpm install --config.minimum-release-age=0

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
RUN mkdir -p /app/storage/receipts && chown -R nextjs:nodejs /app/storage
USER nextjs
EXPOSE 3000
CMD ["sh", "-c", "node node_modules/.bin/tsx scripts/migrate.ts && node node_modules/.bin/next start"]
