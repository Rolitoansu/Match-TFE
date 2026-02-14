FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /usr/src/gatewayservice

COPY package.json .

RUN pnpm install

FROM base AS development
WORKDIR /usr/src/gatewayservice

COPY . .

EXPOSE 8000
CMD ["pnpm", "run", "dev"]

FROM base AS builder
COPY . .

WORKDIR /usr/src/gatewayservice
RUN pnpm run build

FROM node:22-alpine AS production
WORKDIR /usr/src/gatewayservice
RUN npm install -g pnpm

COPY --from=builder /usr/src/gatewayservice/dist ./dist
COPY --from=builder /usr/src/gatewayservice/package.json ./

RUN pnpm install --prod
EXPOSE 8000
CMD ["node", "dist/gatewayservice.js"]