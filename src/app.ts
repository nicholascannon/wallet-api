import type { Application } from 'express';
import express from 'express';
import { WalletController } from './controllers/wallet-controller.js';
import { loggingMiddleware } from './lib/logger.js';
import { zodErrorHandler } from './middleware/zod-error-handler.js';
import type { WalletRepository } from './services/wallet/repository.js';
import { WalletService } from './services/wallet/wallet-service.js';

export function createApp({
	walletRepo,
	enableLogging = true,
}: {
	walletRepo: WalletRepository;
	enableLogging?: boolean;
}): Application {
	const app = express();

	if (enableLogging) app.use(loggingMiddleware);
	app.use(express.json());

	const walletService = new WalletService(walletRepo);
	const walletController = new WalletController(walletService);

	app.use('/v1/wallet', walletController.router);

	app.use(zodErrorHandler);

	return app;
}
