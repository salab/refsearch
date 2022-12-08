FROM node:18-alpine AS builder

WORKDIR /work

COPY package.json yarn.lock ./
RUN yarn

COPY . .
RUN yarn compile

FROM node:18-alpine AS runner

WORKDIR /work

RUN apk add --no-cache tini

COPY package.json yarn.lock ./
RUN yarn --production

COPY --from=builder /work/out .

# NOTE: "node pid 1 problem"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]
