FROM node:20-alpine AS deps
WORKDIR /app
COPY . .
RUN npm install

FROM deps AS build
RUN npm --workspace packages/shared run build
RUN npm --workspace packages/control-data run build
RUN npm --workspace services/gateway-service run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/services/gateway-service ./services/gateway-service
CMD ["node", "services/gateway-service/dist/index.js"]
