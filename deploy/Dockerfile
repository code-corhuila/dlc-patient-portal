FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY angular.json tsconfig*.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build:demo

FROM nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/demo/portals /usr/share/nginx/html/portals
EXPOSE 80
