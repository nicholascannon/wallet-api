# Wallet API

A RESTful API for managing digital wallets built with Go, Gin, and PostgreSQL.

## Features

- **Wallet Management**: Create, retrieve, credit, and debit wallets
- **Optimistic Locking**: Prevents race conditions during concurrent operations
- **Health Checks**: Built-in health monitoring endpoints
- **Structured Logging**: Comprehensive logging with request tracing
- **Graceful Shutdown**: Proper cleanup on application termination
- **Request Timeout**: Configurable request timeouts
- **Database Migrations**: Automatic schema management

## API Endpoints

### Wallet Operations
- `GET /v1/wallet/:id` - Get wallet balance
- `POST /v1/wallet/:id/credit` - Add funds to wallet
- `POST /v1/wallet/:id/debit` - Remove funds from wallet

### Health Checks
- `GET /v1/health/live` - Liveness probe
- `GET /v1/health/ready` - Readiness probe

## Tech Stack

- **Go 1.25.1** - Programming language
- **Gin** - HTTP web framework
- **GORM** - ORM for database operations
- **PostgreSQL** - Primary database
- **Zerolog** - Structured logging
- **Docker** - Containerization

## Quick Start

### Prerequisites
- Go 1.25.1+
- Docker & Docker Compose

### Development Setup

1. **Copy configuration:**
```bash
cp .env.example .env
```

2. **Start the database:**
```bash
docker compose up -d db
```

3. **Run the application:**
```bash
go run cmd/server/main.go
```

## Configuration

The application uses environment variables for configuration:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5432` | Database port |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `password` | Database password |
| `DB_NAME` | `wallet_db` | Database name |
| `DB_SSLMODE` | `disable` | SSL mode |
| `LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |
| `REQUEST_TIMEOUT` | `30s` | Request timeout |
| `SHUTDOWN_TIMEOUT` | `30s` | Graceful shutdown timeout |

## API Usage Examples

### Get Wallet Balance
```bash
curl http://localhost:8080/v1/wallet/123e4567-e89b-12d3-a456-426614174000
```

### Credit Wallet
```bash
curl -X POST http://localhost:8080/v1/wallet/123e4567-e89b-12d3-a456-426614174000/credit \
  -H "Content-Type: application/json" \
  -d '{"amount": 100.50}'
```

### Debit Wallet
```bash
curl -X POST http://localhost:8080/v1/wallet/123e4567-e89b-12d3-a456-426614174000/debit \
  -H "Content-Type: application/json" \
  -d '{"amount": 25.00}'
```

## Project Structure

```
├── cmd/server/          # Application entry point
├── internal/
│   ├── config/          # Configuration management
│   ├── database/        # Database connection & migrations
│   ├── health/          # Health check handlers
│   ├── logger/          # Logging configuration
│   ├── middleware/      # HTTP middleware
│   ├── models/          # Data models
│   ├── server/          # HTTP server setup
│   └── wallet/          # Wallet business logic
├── postman/             # API collection
└── docker-compose.yml   # Docker services
```
