CREATE TABLE "wallet_transactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"wallet_id" uuid NOT NULL,
	"balance" numeric(20, 2) NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"version" numeric(20, 0) NOT NULL,
	CONSTRAINT "wallet_id_version_unique" UNIQUE("wallet_id","version")
);
