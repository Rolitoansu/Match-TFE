FROM node:25.7-alpine AS development
WORKDIR /app
RUN npm install -g pnpm

COPY ./webapp ./
RUN pnpm install

EXPOSE 3000
CMD ["pnpm", "run", "dev"]

FROM node:25.7-alpine AS build
WORKDIR /app
RUN npm install -g pnpm

COPY ./webapp ./
RUN pnpm install

ARG VITE_PUBLIC_API_URL=http://localhost:8000
ENV VITE_PUBLIC_API_URL=${VITE_PUBLIC_API_URL}

RUN pnpm run build

FROM nginx:1.27-alpine AS release
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./webapp/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
