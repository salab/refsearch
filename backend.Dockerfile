FROM node:19-alpine AS builder

WORKDIR /work/backend

COPY backend/package.json backend/yarn.lock ./
RUN yarn

COPY backend .
COPY common /work/common/
RUN yarn compile

FROM node:19-alpine AS runner-base

WORKDIR /work

COPY backend/package.json backend/yarn.lock ./
RUN yarn --production

FROM node:19-alpine AS api-runner

WORKDIR /work

RUN apk add --no-cache tini

COPY --from=runner-base /work/node_modules node_modules/
COPY --from=builder /work/backend/out /work
COPY package.json /work
COPY backend/package.json /work/backend

# NOTE: "node pid 1 problem"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "backend/src/cmd/index.js"]

FROM node:19-alpine AS job-runner

WORKDIR /work

RUN apk add --no-cache tini git

COPY --from=runner-base /work/node_modules node_modules/
COPY --from=builder /work/backend/out /work
COPY package.json /work
COPY backend/package.json /work/backend

# NOTE: "node pid 1 problem"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "backend/src/cmd/jobRunner.js"]
