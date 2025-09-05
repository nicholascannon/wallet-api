CREATE TABLE "wallet" (
	"id" uuid PRIMARY KEY NOT NULL,
	"balance" numeric(20, 2) DEFAULT '0' NOT NULL
);
