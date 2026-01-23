# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy all source files (needed for Nx monorepo)
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile --network-timeout 600000

# Build the frontend application
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_URL_SOCKET
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL_SOCKET=$NEXT_PUBLIC_API_URL_SOCKET

RUN npx nx build web --prod

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application (Standalone Next.js)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
