import 'dotenv/config';
import { createApp } from './app.js';
import { CONFIG } from './config/index.js';
import { createDb } from './data/db.js';
import { HealthCheckRepo } from './data/repositories/health-check-repo.js';
import { PgWalletRepo } from './data/repositories/pg-wallet-repo.js';
import { lifecycle } from './lib/lifecycle.js';
import { LOGGER, setupProcessLogging } from './lib/logger.js';

setupProcessLogging();

const { db, pool } = createDb(CONFIG.db);

const app = createApp({
	walletRepo: new PgWalletRepo(db),
	healthCheckRepo: new HealthCheckRepo(db),
}).listen(CONFIG.port, () => {
	LOGGER.info('Server started', { port: CONFIG.port });

	lifecycle.on('close', () =>
		app.close(() => {
			LOGGER.info('Server closed');
			pool.end().then(() => LOGGER.info('Postgres pool closed'));
		}),
	);
});
