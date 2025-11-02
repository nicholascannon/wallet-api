import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { LOGGER } from '../lib/logger.js';

export function createDb(): { db: NodePgDatabase; pool: Pool } {
	const pool = new Pool({
		user: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		database: process.env.DB_NAME,
	});

	pool.on('connect', () => LOGGER.info('Postgres connected'));
	pool.on('error', (err) => LOGGER.error('Postgres pool error', err));

	return { db: drizzle({ client: pool }), pool };
}
