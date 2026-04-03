FROM node:25.7-alpine AS development
WORKDIR /usr/src/gatewayservice

RUN npm install -g pnpm
COPY . .

RUN pnpm install

EXPOSE 8000
CMD ["pnpm", "run", "dev"]

FROM node:25.7-alpine AS release
WORKDIR /usr/src/gatewayservice

RUN npm install -g pnpm
COPY . .

RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
EXPOSE 8000
CMD ["pnpm", "exec", "tsx", "gatewayservice.ts"]