FROM node:20-alpine AS deps
WORKDIR /app
COPY . .
RUN npm install

FROM deps AS build
RUN npm --workspace packages/shared run build
RUN npm --workspace services/stream-engine run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/services/stream-engine ./services/stream-engine
CMD ["node", "services/stream-engine/dist/index.js"]
