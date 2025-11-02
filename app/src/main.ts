import 'dotenv/config';
import { createApp } from './app.js';
import { createDb } from './data/db.js';
import { HealthCheckRepo } from './data/repositories/health-check-repo.js';
import { PgWalletRepo } from './data/repositories/pg-wallet-repo.js';
import { lifecycle } from './lib/lifecycle.js';
import { LOGGER, setupProcessLogging } from './lib/logger.js';

setupProcessLogging();

const PORT = process.env.PORT;

const { db, pool } = createDb();

const app = createApp({
	walletRepo: new PgWalletRepo(db),
	healthCheckRepo: new HealthCheckRepo(db),
}).listen(PORT, () => {
	LOGGER.info('Server started', { port: PORT });

	lifecycle.on('close', () =>
		app.close(() => {
			LOGGER.info('Server closed');
			pool.end().then(() => LOGGER.info('Postgres pool closed'));
		}),
	);
});
