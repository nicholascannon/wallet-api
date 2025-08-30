import type { Application } from 'express';
import express from 'express';
import { WalletController } from './controllers/wallet-controller.js';
import { loggingMiddleware } from './lib/logger.js';
import { WalletService } from './services/wallet/index.js';

export function createApp(): Application {
	const app = express();
	app.use(loggingMiddleware);
	app.use(express.json());

	const walletService = new WalletService();
	const walletController = new WalletController(walletService);

	app.use('/v1/wallet', walletController.router);

	return app;
}
