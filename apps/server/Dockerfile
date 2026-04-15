FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json package-lock.json* turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/emails/package.json ./packages/emails/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate
RUN cd apps/server && npx tsc --project tsconfig.json

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 server

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=deps --chown=server:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/prisma ./prisma

USER server
EXPOSE 3001

CMD ["node", "dist/server.js"]
