# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

# Copy configuration files
COPY eslint.config.mjs ./
COPY nx.json ./
COPY tsconfig*.json ./

# Copy source code
COPY apps/co ./apps/co
COPY libs ./libs

# Build the application
RUN npx nx build co --prod

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/dist/apps/co ./
COPY --from=builder /app/dist/libs ./libs

# Install production dependencies only
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
RUN yarn install --production --frozen-lockfile --network-timeout 600000

ARG CO_PORT=8080
EXPOSE $CO_PORT

CMD ["node", "main.js"]

