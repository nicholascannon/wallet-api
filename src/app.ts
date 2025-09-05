import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Application } from 'express';
import express from 'express';
import { WalletController } from './controllers/wallet-controller.js';
import { PgWalletRepo } from './data/repositories/pg-wallet-repo.js';
import { loggingMiddleware } from './lib/logger.js';
import { WalletService } from './services/wallet/wallet-service.js';

export function createApp(db: NodePgDatabase): Application {
	const app = express();

	app.use(loggingMiddleware);
	app.use(express.json());

	const walletRepo = new PgWalletRepo(db);
	const walletService = new WalletService(walletRepo);
	const walletController = new WalletController(walletService);

	app.use('/v1/wallet', walletController.router);

	return app;
}
