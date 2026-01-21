# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy all source files (needed for Nx monorepo)
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile --network-timeout 600000

# Build the backend application
RUN npx nx build co --prod

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/dist/apps/co ./
COPY --from=builder /app/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "main.js"]
