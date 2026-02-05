FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /usr/src/authservice
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

FROM base AS development
COPY . .
CMD ["pnpm", "dlx", "tsx", "watch", "authservice.ts"]

FROM base AS builder
COPY . .
RUN pnpm run build

FROM node:22-alpine AS production
WORKDIR /usr/src/authservice
COPY --from=builder /usr/src/authservice/dist ./dist
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --prod
CMD ["node", "dist/authservice.js"]