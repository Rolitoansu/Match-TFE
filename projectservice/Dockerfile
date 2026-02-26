FROM node:25.7-alpine AS base
RUN npm install -g pnpm
WORKDIR /usr/src

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY projectservice/package.json ./projectservice/
COPY database/package.json ./database/

FROM base AS development
COPY database/ ./database/
COPY projectservice/ ./projectservice/

WORKDIR /usr/src/projectservice
RUN pnpm install

EXPOSE 5001
CMD ["pnpm", "run", "dev"]

FROM base AS builder
COPY database/ ./database/
COPY projectservice/ ./projectservice/

WORKDIR /usr/src/projectservice
RUN pnpm run build

FROM node:25.7-alpine AS production
WORKDIR /usr/src/projectservice
RUN npm install -g pnpm

COPY --from=builder /usr/src/projectservice/dist ./dist
COPY --from=builder /usr/src/projectservice/package.json ./
COPY --from=builder /usr/src/database ./../database

RUN pnpm install --prod
EXPOSE 5001
CMD ["node", "dist/projectservice.js"]