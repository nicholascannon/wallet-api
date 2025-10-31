CREATE TABLE "wallet" (
	"id" uuid PRIMARY KEY NOT NULL,
	"balance" numeric(20, 2) DEFAULT '0' NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"updated" timestamp DEFAULT now() NOT NULL,
	"version" numeric(20, 0) DEFAULT '0' NOT NULL,
	CONSTRAINT "wallet_id_version_unique" UNIQUE("id","version")
);
