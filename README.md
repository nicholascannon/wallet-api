# Wallet API


For ur fundzzz

## setup

Dev mode:

```bash
cp .env.example .env
npm ci
npm run db:migrate
docker compose up -d db
npm run dev
```

Otherwise:

```bash
docker compose up -d
npm run db:migrate
```
