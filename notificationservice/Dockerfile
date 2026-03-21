FROM node:25-alpine AS development
WORKDIR /usr/src
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY notificationservice/ ./notificationservice/
COPY database/ ./database/

WORKDIR /usr/src/notificationservice
RUN pnpm install

EXPOSE 5004
CMD ["pnpm", "run", "dev"]
