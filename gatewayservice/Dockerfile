FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /usr/src

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY gatewayservice/package.json ./gatewayservice/
COPY database/package.json ./database/

RUN pnpm install

FROM base AS development
COPY database/ ./database/
COPY gatewayservice/ ./gatewayservice/

WORKDIR /usr/src/gatewayservice
EXPOSE 8000
CMD ["pnpm", "run", "dev"]

FROM base AS builder
COPY database/ ./database/
COPY gatewayservice/ ./gatewayservice/

WORKDIR /usr/src/gatewayservice
RUN pnpm run build

FROM node:22-alpine AS production
WORKDIR /usr/src/gatewayservice
RUN npm install -g pnpm

COPY --from=builder /usr/src/gatewayservice/dist ./dist
COPY --from=builder /usr/src/gatewayservice/package.json ./
COPY --from=builder /usr/src/database ./../database

RUN pnpm install --prod
EXPOSE 8000
CMD ["node", "dist/gatewayservice.js"]