CREATE TYPE "wallet"."transaction_type" AS ENUM('CREDIT', 'DEBIT');--> statement-breakpoint
CREATE TABLE "wallet"."transactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"wallet_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"type" "wallet"."transaction_type" NOT NULL,
	"balance" numeric(20, 2) NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"version" numeric(20, 0) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "transactions_transaction_id_unique" UNIQUE("transaction_id"),
	CONSTRAINT "wallet_id_version_unique" UNIQUE("wallet_id","version")
);
