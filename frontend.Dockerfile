FROM node:18-alpine AS base

WORKDIR /work/frontend

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn

FROM base AS builder

COPY frontend .
COPY common /work/common/
RUN yarn build

FROM caddy:2 AS runner

COPY frontend/Caddyfile /etc/caddy/Caddyfile

COPY --from=builder /work/frontend/dist/ /srv
