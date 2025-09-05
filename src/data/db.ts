import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { LOGGER } from '../lib/logger.js';

export function createDb() {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	pool.on('error', (err) => LOGGER.error('Postgres pool error', err));

	return drizzle({ client: pool });
}
