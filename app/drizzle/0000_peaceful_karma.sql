CREATE TYPE "public"."transaction_type" AS ENUM('CREDIT', 'DEBIT');--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"wallet_id" uuid NOT NULL,
	"balance" numeric(20, 2) NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"version" numeric(20, 0) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"type" "transaction_type" NOT NULL,
	CONSTRAINT "wallet_id_version_unique" UNIQUE("wallet_id","version")
);
