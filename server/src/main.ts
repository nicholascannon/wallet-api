import 'dotenv/config';
import { createApp } from './app.js';
import { CONFIG } from './config/env.js';
import { createDb } from './data/db.js';
import { lifecycle } from './lib/lifecycle.js';
import { LOGGER, setupProcessLogging } from './lib/logger.js';
import { HealthCheckRepo } from './services/health/repositories/health-check-repo.js';
import { PgWalletRepo } from './services/wallet/repositories/pg-wallet-repo.js';

setupProcessLogging();

LOGGER.info('CONFIG', {
	config: {
		env: CONFIG.env,
		port: CONFIG.port,
		cors: CONFIG.cors,
		db: {
			host: CONFIG.db.host,
			port: CONFIG.db.port,
			database: CONFIG.db.database,
			user: CONFIG.db.user,
			// Don't log the password
		},
		requestTimeout: CONFIG.requestTimeout,
		enableOpenApiDocs: CONFIG.enableOpenApiDocs,
	},
});

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
