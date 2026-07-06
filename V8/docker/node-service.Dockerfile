FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
COPY frontend ./frontend
RUN npm install

FROM deps AS build
ARG WORKSPACE
RUN npm --workspace packages/shared run build
RUN npm --workspace packages/control-data run build
RUN npm --workspace ${WORKSPACE} run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ARG WORKSPACE
ENV WORKSPACE=${WORKSPACE}
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/services ./services
COPY package.json ./
CMD ["sh", "-c", "node ${WORKSPACE}/dist/index.js"]
