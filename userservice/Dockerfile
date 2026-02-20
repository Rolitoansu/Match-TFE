FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /usr/src

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY userservice/package.json ./userservice/
COPY database/package.json ./database/

FROM base AS development
COPY database/ ./database/
COPY userservice/ ./userservice/

WORKDIR /usr/src/userservice
RUN pnpm install

EXPOSE 5001
CMD ["pnpm", "run", "dev"]

FROM base AS builder
COPY database/ ./database/
COPY userservice/ ./userservice/

WORKDIR /usr/src/userservice
RUN pnpm run build

FROM node:22-alpine AS production
WORKDIR /usr/src/userservice
RUN npm install -g pnpm

COPY --from=builder /usr/src/userservice/dist ./dist
COPY --from=builder /usr/src/userservice/package.json ./
COPY --from=builder /usr/src/database ./../database

RUN pnpm install --prod
EXPOSE 5001
CMD ["node", "dist/userservice.js"]