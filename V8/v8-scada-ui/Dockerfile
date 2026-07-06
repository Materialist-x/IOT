FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=
ARG VITE_SIGNALR_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SIGNALR_URL=${VITE_SIGNALR_URL}
COPY . .
RUN npm install
RUN npm --workspace v8-scada-ui run build

FROM nginx:1.27-alpine
COPY --from=build /app/v8-scada-ui/dist /usr/share/nginx/html
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
