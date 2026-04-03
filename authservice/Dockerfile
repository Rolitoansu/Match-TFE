FROM node:25-alpine AS development
WORKDIR /usr/src
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY authservice/ ./authservice/
COPY database/ ./database/

WORKDIR /usr/src/authservice
RUN pnpm install

EXPOSE 5001
CMD ["pnpm", "run", "dev"]

FROM node:25-alpine AS release
WORKDIR /usr/src
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY authservice/ ./authservice/
COPY database/ ./database/

WORKDIR /usr/src/authservice
RUN pnpm install

ENV NODE_ENV=production
EXPOSE 5000
CMD ["pnpm", "exec", "tsx", "authservice.ts"]