# Build stage
FROM trananhtu/base-build AS builder

COPY eslint.config.mjs ./
COPY nx.json ./
COPY tsconfig*.json ./
COPY .env ./

COPY apps/noti ./apps/noti
COPY libs ./libs

RUN npx nx build noti --prod

# Production stage
FROM trananhtu/base-deploy-be AS production

COPY --from=builder /app/dist/apps/noti ./
COPY --from=builder /app/dist/libs ./libs
  
ARG NOTI_PORT=8081
ARG SOCKET_PORT=8082
EXPOSE $NOTI_PORT
EXPOSE $SOCKET_PORT

CMD ["node", "main.js"]
