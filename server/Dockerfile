FROM node:22.13.0-alpine AS base

FROM base AS build
WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY biome.json ./biome.json
COPY tsconfig.json .
COPY drizzle.config.ts .
COPY vitest.config.ts .
COPY ./drizzle ./drizzle
COPY ./src ./src
COPY openapi.yaml ./openapi.yaml

RUN npm run build
RUN npm run lint
RUN npm run test

FROM base AS runtime
WORKDIR /opt/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/drizzle ./drizzle
COPY --from=build /usr/src/app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/openapi.yaml ./openapi.yaml

USER node
ENV NODE_ENV=production

ENTRYPOINT [ "node", "./dist/main" ]
