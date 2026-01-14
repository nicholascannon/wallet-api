import * as z from 'zod';

export const CONFIG = z
	.object({
		env: z.enum(['development', 'production', 'test']),
		port: z.string().transform(Number),
		cors: z.object({
			hosts: z
				.string()
				.optional()
				.transform((val) => val?.split(',').map((s) => s.trim()) ?? [])
				.pipe(z.array(z.string())),
		}),
		db: z.object({
			host: z.string(),
			port: z.string().transform(Number),
			database: z.string(),
			user: z.string(),
			password: z.string(),
		}),
		requestTimeout: z.number().optional().transform(Number).default(30_000),
		enableOpenApiDocs: z
			.string()
			.optional()
			.transform((val) => val === 'true')
			.default(false),
	})
	.parse({
		env: process.env.NODE_ENV,
		port: process.env.PORT,
		cors: {
			hosts: process.env.CORS_HOSTS,
		},
		db: {
			host: process.env.DB_HOST,
			port: process.env.DB_PORT,
			database: process.env.DB_NAME,
			user: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
		},
		requestTimeout: process.env.REQUEST_TIMEOUT,
		enableOpenApiDocs: process.env.ENABLE_OPENAPI_DOCS,
	});

export type Config = typeof CONFIG;
