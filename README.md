# Wallet API

A minimal wallet service with a Node.js HTTP API and AWS CDK infrastructure, designed as a wallet for casino use cases. The API exposes basic wallet operations (create-on-first-credit, debit, credit, balance read).

## Structure

```
wallet-api/
├── .github/workflows/  # CI/CD pipelines
├── server/             # Express API server
│   ├── src/            # Application code
│   ├── Dockerfile
│   └── drizzle.config.ts
├── infra/              # AWS CDK infrastructure
├── bruno/              # API collection for testing
├── docker-compose.yml
├── run.sh              # Docker startup script
├── stop.sh             # Docker shutdown script
└── db.sh               # Database-only startup script
```

## Prerequisites

- Node.js v22.13.0 (see `.nvmrc`)
- npm (bundled with Node)
- Docker & Docker Compose (for containerized deployment)

For infrastructure work (`infra`):

- AWS account and credentials configured via the AWS CLI
- AWS CDK CLI (`npm install -g aws-cdk`)

## Development

Install dependencies:

```bash
cd server
npm ci
```

Run the API in development mode with hot reload:

```bash
# Start database and run migrations
../db.sh

# Copy environment file
cp .env.example .env

# Run migrations
npm run db:migrate

# Start the API
npm run start
```

The API will listen on the port defined in `.env` (default: `8000`).

### Other Commands

All commands below are run from `server/`:

```bash
# Build
npm run build

# Testing
npm test
npm run test:ui
npm run coverage
npm run coverage:ui

# Linting
npm run lint
npm run lint:fix

# Database
npm run db:migrate
npm run db:generate
```

## Docker

Build and run with Docker Compose:

```bash
./run.sh
# or
docker compose --profile api up --build
```

Stop containers:

```bash
./stop.sh
# or
docker compose down
```

The Docker setup:

1. Starts a Postgres 13 container (`db` service)
2. Runs database migrations (`migrations` service)
3. Builds and runs the API container (`wallet-api` service) on port `8000`

Environment details:

- DB: `postgres://postgres:postgres@localhost:5432/casino`
- API: `http://localhost:8000`

To start only the database and migrations (no API):

```bash
./db.sh
```

## Server Configuration

The API can be configured via environment variables (see `.env.example` and `server/src/config/env.ts`):

```bash
# Environment (development | production | test)
NODE_ENV=development

# Server port (default: 8000)
PORT=8000

# CORS allowed hosts (comma-separated)
CORS_HOSTS=http://localhost:5173,http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=casino
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Request timeout in ms (default: 30000)
REQUEST_TIMEOUT=30000
```

Create a `.env` file in the `server/` directory or set these variables in your environment.

## API Overview

- Base URL: `http://localhost:8000`
- Endpoints:
  - `GET /v1/health` - Health check
  - `GET /v1/wallet/:id` - Get wallet balance
  - `POST /v1/wallet/:id/credit` - Credit funds to wallet
  - `POST /v1/wallet/:id/debit` - Debit funds from wallet

Example:

```bash
curl -X POST \
  http://localhost:8000/v1/wallet/4bcaf50f-7c95-4f97-9a08-fbaddf966cb9/credit \
  -H 'Content-Type: application/json' \
  -d '{"amount": "10.00"}' \
```

```bash
curl http://localhost:8000/v1/wallet/4bcaf50f-7c95-4f97-9a08-fbaddf966cb9
```

## Tech Stack

- **Backend**: Express 5, TypeScript, Drizzle ORM, PostgreSQL
- **Testing**: Vitest, Supertest
- **Tooling**: Biome (linting/formatting), Winston (logging), Helmet, CORS
- **Infrastructure**: AWS CDK, ECS Fargate, RDS PostgreSQL, Application Load Balancer

## CI/CD

The project uses GitHub Actions to build and publish Docker images to ECR Public.

### Pipeline Triggers

The pipeline runs on:
- Pushes to `main` that modify server code, dependencies, or the workflow itself
- Manual trigger via `workflow_dispatch`

### What It Does

1. Builds the Docker image from `server/Dockerfile`
2. Pushes to `public.ecr.aws/h8w8n0h7/wallet-api` with tags:
   - `latest`
   - Short git SHA (e.g., `a1b2c3d`)

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | ARN of the IAM role for OIDC authentication (e.g., `arn:aws:iam::123456789012:role/GitHubActionsECRPush`) |

### AWS Setup

The pipeline uses OIDC federation for authentication (no long-lived credentials). See the [GitHub Actions OIDC docs](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) for setup instructions.

## Infrastructure Deployment (CDK)

### Setup

```bash
cd infra
npm ci
```

### Useful Commands

From `infra/`:

```bash
# Synthesize CloudFormation template
npx cdk synth

# Compare deployed stack with current state
npx cdk diff

# Deploy stack
npx cdk deploy --context environment=dev --context imageTag=latest
```

You must pass a valid `imageTag` for the API image in ECR and ensure the `vpcId` in `infra/lib/config.ts` is correct for your environment.
