import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './drizzle',
	schema: './src/data/schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: config file
		url: process.env.DATABASE_URL!,
	},
});
