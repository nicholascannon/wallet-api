import * as z from 'zod';

export const CONFIG = z
	.object({
		port: z.string().transform(Number),
		db: z.object({
			host: z.string(),
			port: z.string().transform(Number),
			name: z.string(),
			user: z.string(),
			password: z.string(),
		}),
	})
	.parse(process.env);

export type Config = typeof CONFIG;
