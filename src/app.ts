import type { Application } from 'express';
import express from 'express';
import { WalletController } from './controllers/wallet-controller.js';
import { loggingMiddleware } from './lib/logger.js';

export function createApp(): Application {
	const app = express();
	app.use(loggingMiddleware);
	app.use(express.json());

	const walletController = new WalletController();

	app.use('/v1/wallet', walletController.router);

	return app;
}
