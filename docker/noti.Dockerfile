# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy all source files (needed for Nx monorepo)
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile --network-timeout 600000

# Build the notification application
RUN npx nx build noti --prod

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/dist/apps/noti ./
COPY --from=builder /app/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production

EXPOSE 8081 8082

CMD ["node", "main.js"]
