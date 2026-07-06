FROM node:20-alpine AS build
WORKDIR /app
ENV VITE_API_BASE_URL=http://localhost:8080
ENV VITE_SIGNALR_URL=http://localhost:8090
COPY . .
RUN npm install
RUN npm --workspace v8-scada-ui run build

FROM nginx:1.27-alpine
COPY --from=build /app/v8-scada-ui/dist /usr/share/nginx/html
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
