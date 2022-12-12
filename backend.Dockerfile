FROM node:18-alpine AS builder

WORKDIR /work/backend

COPY backend/package.json backend/yarn.lock ./
RUN yarn

COPY backend .
COPY types /work/types/
RUN yarn compile

FROM node:18-alpine AS runner

WORKDIR /work

RUN apk add --no-cache tini git

COPY backend/package.json backend/yarn.lock ./
RUN yarn --production

COPY --from=builder /work/backend/out .

# NOTE: "node pid 1 problem"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "backend/src/index.js"]
