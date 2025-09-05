ALTER TABLE "wallet" ADD COLUMN "created" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet" ADD COLUMN "updated" timestamp DEFAULT now() NOT NULL;