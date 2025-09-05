FROM node:22.13.0-alpine AS base

FROM base AS build
WORKDIR /usr/src/app

RUN corepack enable

COPY .yarnrc.yml ./
COPY package.json ./
COPY yarn.lock ./
RUN yarn --immutable

COPY ./src ./src
COPY tsconfig.json .
COPY biome.json .
COPY vitest.config.ts .

RUN yarn lint
RUN yarn build
RUN yarn test

FROM base AS runtime
WORKDIR /opt/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/yarn.lock ./

USER node

ENTRYPOINT [ "node", "./dist/main" ]
