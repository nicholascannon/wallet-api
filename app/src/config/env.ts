import * as z from 'zod';

export const CONFIG = z
	.object({
		env: z.enum(['development', 'production', 'test']),
		port: z.string().transform(Number),
		db: z.object({
			host: z.string(),
			port: z.string().transform(Number),
			database: z.string(),
			user: z.string(),
			password: z.string(),
		}),
	})
	.parse({
		env: process.env.NODE_ENV,
		port: process.env.PORT,
		db: {
			host: process.env.DB_HOST,
			port: process.env.DB_PORT,
			database: process.env.DB_NAME,
			user: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
		},
	});

export type Config = typeof CONFIG;
