FROM node:25-alpine
WORKDIR /app
RUN npm install -g pnpm

COPY ./webapp ./
RUN pnpm install

EXPOSE 3000
CMD ["pnpm", "run", "dev"]