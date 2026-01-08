# Wallet API

A minimal wallet service with a Node.js HTTP API and AWS CDK infrastructure, designed as a wallet for casino use cases. The API exposes basic wallet operations (create-on-first-credit, debit, credit, balance read).

## Project structure

- `server/` – TypeScript/Node.js HTTP API (Express 5, Drizzle ORM, Vitest, Biome)
  - `src/` – application code (config, data access, middleware, services, controllers)
  - `drizzle.config.ts` – database and migration config
- `infra/` – AWS CDK stack for deploying the API to ECS Fargate with RDS Postgres and an ALB
- `docker-compose.yml` – local DB, migrations, and API services
- `run.sh` / `stop.sh` / `db.sh` – convenience scripts for running via Docker

## Prerequisites

- Node.js v22.13.0 (see `.nvmrc`)
- Docker + Docker Compose
- npm (bundled with Node)

For infrastructure work (`infra`):

- AWS account and credentials configured via the AWS CLI
- AWS CDK CLI (`npm install -g aws-cdk`)

## API overview

- Base URL: `http://localhost:8000`
- Endpoints:
  - `GET /v1/health`
  - `GET /v1/wallet/:id`
  - `POST /v1/wallet/:id/credit`
  - `POST /v1/wallet/:id/debit`

Example:

```bash
curl -X POST \
  http://localhost:8000/v1/wallet/00000000-0000-0000-0000-000000000001/credit \
  -H 'Content-Type: application/json' \
  -d '{"amount": 10.0}'
```

## Configuration

The API reads configuration from environment variables (see `.env.example` and `server/src/config/env.ts`):

- `NODE_ENV`
- `PORT`
- `CORS_HOSTS`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- `REQUEST_TIMEOUT` (optional, in milliseconds)

## Running the application with Docker (recommended)

From the repo root:

```bash
./run.sh
```

This will:

- Start a Postgres 13 container (`db` service)
- Run database migrations (`migrations` service)
- Build and run the API container (`wallet-api` service) on port `8000`

Environment details (see `docker-compose.yml`):

- DB: `postgres://postgres:postgres@localhost:5432/casino`
- API: `http://localhost:8000`

To stop the API and its containers:

```bash
./stop.sh
```

To start only the database and migrations (no API profile):

```bash
./db.sh
```

## Local development with hot reload (server only)

For a faster dev loop (TypeScript + hot reload) you can run the API directly on your machine and use Docker only for Postgres.

From the repo root, then `server/`:

```bash
./db.sh
cd server
npm ci
cp .env.example .env
npm run db:migrate
npm run start
```

The API will listen on the port defined in `.env` (commonly `8000`).

### Useful npm scripts (server)

All commands below are run from `server/`:

```bash
npm run build
npm run lint
npm run lint:fix
npm run db:migrate
npm run db:generate
```

## Testing

### API tests (Vitest)

From `server/`:

```bash
npm test
npm run test:ui
npm run coverage
npm run coverage:ui
npx vitest src/services/wallet/__tests__/wallet-service.test.ts
```

Tests primarily live under `src/**/__tests__/`.

## Deploying infrastructure (CDK)

### Setup

```bash
cd infra
npm ci
```

### Useful commands

From `infra/`:

```bash
npx cdk synth
npx cdk diff
npx cdk deploy --context environment=dev --context imageTag=latest
```

You must pass a valid `imageTag` for the API image in ECR and ensure the `vpcId` in `infra/lib/config.ts` is correct for your environment.
