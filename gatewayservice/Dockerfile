FROM node:25.7-alpine as development
WORKDIR /usr/src/gatewayservice

RUN npm install -g pnpm
COPY . .

RUN pnpm install

EXPOSE 8000
CMD ["pnpm", "run", "dev"]