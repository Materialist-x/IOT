FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* tsconfig.base.json ./
COPY frontend ./frontend
RUN npm install

FROM deps AS build
ARG WORKSPACE
RUN npm --workspace ${WORKSPACE} run build

FROM nginx:1.27-alpine
ARG APP_DIR
COPY --from=build /app/${APP_DIR}/dist /usr/share/nginx/html
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
