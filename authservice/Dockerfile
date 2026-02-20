FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /usr/src

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY authservice/package.json ./authservice/
COPY database/package.json ./database/

FROM base AS development
COPY database/ ./database/
COPY authservice/ ./authservice/

WORKDIR /usr/src/authservice
RUN pnpm install

EXPOSE 5000
CMD ["pnpm", "run", "dev"]

FROM base AS builder
COPY database/ ./database/
COPY authservice/ ./authservice/

WORKDIR /usr/src/authservice
RUN pnpm run build

FROM node:22-alpine AS production
WORKDIR /usr/src/authservice
RUN npm install -g pnpm

COPY --from=builder /usr/src/authservice/dist ./dist
COPY --from=builder /usr/src/authservice/package.json ./
COPY --from=builder /usr/src/database ./../database

RUN pnpm install --prod
EXPOSE 5000
CMD ["node", "dist/authservice.js"]