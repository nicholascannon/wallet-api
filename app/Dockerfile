FROM node:22.13.0-alpine AS base

FROM base AS build
WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY ./src ./src
COPY tsconfig.json .
COPY vitest.config.ts .

RUN npm run build
RUN npm run test

FROM base AS runtime
WORKDIR /opt/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./

USER node

ENTRYPOINT [ "node", "./dist/main" ]
