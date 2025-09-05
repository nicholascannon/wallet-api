import 'dotenv/config';
import { createApp } from './app.js';
import { createDb } from './data/db.js';
import { PgWalletRepo } from './data/repositories/pg-wallet-repo.js';
import { lifecycle } from './lib/lifecycle.js';
import { LOGGER, setupProcessLogging } from './lib/logger.js';

setupProcessLogging();

const { db, pool } = createDb();

const app = createApp({
	walletRepo: new PgWalletRepo(db),
}).listen(process.env.PORT, () => {
	LOGGER.info('Server is running on http://localhost:3000');

	lifecycle.on('close', () =>
		app.close(() => {
			LOGGER.info('Server closed');
			pool.end().then(() => LOGGER.info('Postgres pool closed'));
		}),
	);
});
