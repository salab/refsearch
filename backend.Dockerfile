FROM node:18-alpine AS builder

WORKDIR /work/backend

COPY backend/package.json backend/yarn.lock ./
RUN yarn

COPY backend .
COPY common /work/common/
RUN yarn compile

FROM node:18-alpine AS runner-base

WORKDIR /work

RUN apk add --no-cache tini git

COPY backend/package.json backend/yarn.lock ./
RUN yarn --production

COPY --from=builder /work/backend/out .

FROM runner-base AS api-runner

# NOTE: "node pid 1 problem"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "backend/src/cmd/index.js"]

FROM runner-base AS job-runner

# NOTE: "node pid 1 problem"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "backend/src/cmd/jobRunner.js"]
