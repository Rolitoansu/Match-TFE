FROM node:alpine AS development
WORKDIR /usr/src
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY projectservice/ ./projectservice/
COPY database/ ./database/

WORKDIR /usr/src/projectservice
RUN pnpm install

EXPOSE 5001
CMD ["pnpm", "run", "dev"]

FROM node:alpine AS release
WORKDIR /usr/src
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY projectservice/ ./projectservice/
COPY database/ ./database/

WORKDIR /usr/src/projectservice
RUN pnpm install

ENV NODE_ENV=production
EXPOSE 5002
CMD ["pnpm", "exec", "tsx", "projectservice.ts"]