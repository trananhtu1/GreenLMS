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

# Install production dependencies
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile --network-timeout 600000

# Copy built application
COPY --from=builder /app/dist/apps/co ./

# Set environment
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "main.js"]
