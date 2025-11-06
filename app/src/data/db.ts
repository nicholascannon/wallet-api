import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { Config } from '../config/index.js';
import { LOGGER } from '../lib/logger.js';

export function createDb(config: Config['db']): {
	db: NodePgDatabase;
	pool: Pool;
} {
	const pool = new Pool({ ...config });

	pool.on('connect', () => LOGGER.info('Postgres connected'));
	pool.on('error', (err) => LOGGER.error('Postgres pool error', err));

	return { db: drizzle({ client: pool, logger: true }), pool };
}
