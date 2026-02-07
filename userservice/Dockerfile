FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /usr/src/userservice
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

FROM base AS development
COPY . .
EXPOSE 5001
CMD ["pnpm", "dlx", "tsx", "watch", "userservice.ts"]

FROM base AS builder
COPY . .
RUN pnpm run build

FROM node:22-alpine AS production
WORKDIR /usr/src/userservice
COPY --from=builder /usr/src/userservice/dist ./dist
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install
EXPOSE 5001
CMD ["node", "dist/userservice.js"]