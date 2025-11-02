// @ts-nocheck
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/data/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${Number(process.env.DB_PORT)}/${process.env.DB_NAME}`,
	},
});
