FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /usr/src/gatewayservice
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

FROM base AS development
COPY . .
CMD ["pnpm", "dlx", "tsx", "watch", "gatewayservice.ts"]

FROM base AS builder
COPY . .
RUN pnpm run build

FROM node:22-alpine AS production
WORKDIR /usr/src/gatewayservice
COPY --from=builder /usr/src/gatewayservice/dist ./dist
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install
CMD ["node", "dist/gatewayservice.js"]