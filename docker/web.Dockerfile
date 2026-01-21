# Build stage
FROM trananhtu/base-build AS builder

COPY eslint.config.mjs ./
COPY nx.json ./
COPY tsconfig*.json ./
COPY .env ./

COPY apps/web ./apps/web

RUN npx nx build web --prod

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone/apps/web ./
COPY --from=builder /app/apps/web/.next/standalone/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

ARG WEB_PORT=3000
EXPOSE $WEB_PORT

CMD ["node", "server.js"]

