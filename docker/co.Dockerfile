# Build stage
FROM trananhtu/base-build AS builder

COPY eslint.config.mjs ./
COPY nx.json ./
COPY tsconfig*.json ./
COPY .env ./

COPY apps/co ./apps/co
COPY libs ./libs

RUN npx nx build co --prod

# Production stage
FROM trananhtu/base-deploy-be AS production

WORKDIR /app

COPY --from=builder /app/dist/apps/co ./
COPY --from=builder /app/dist/libs ./libs

ARG CO_PORT=8080
EXPOSE $CO_PORT

CMD ["node", "main.js"]
