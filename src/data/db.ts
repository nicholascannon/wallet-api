import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { LOGGER } from '../lib/logger.js';

export function createDb(): { db: NodePgDatabase; pool: Pool } {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });

	pool.on('connect', () => LOGGER.info('Postgres connected'));
	pool.on('error', (err) => LOGGER.error('Postgres pool error', err));

	return { db: drizzle({ client: pool }), pool };
}
