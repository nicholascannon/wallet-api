import cors from 'cors';
import type { Application } from 'express';
import express from 'express';
import { CONFIG } from './config/env.js';
import { HealthController } from './controllers/health-controller.js';
import { WalletController } from './controllers/wallet-controller.js';
import { loggingMiddleware } from './lib/logger.js';
import { genericErrorHandler } from './middleware/generic-error-handler.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { zodErrorHandler } from './middleware/zod-error-handler.js';
import type { HealthRepository } from './services/health/health-repository.js';
import type { WalletRepository } from './services/wallet/repository.js';
import { WalletService } from './services/wallet/wallet-service.js';

export function createApp({
	walletRepo,
	healthCheckRepo,
	enableLogging = true,
}: {
	walletRepo: WalletRepository;
	healthCheckRepo: HealthRepository;
	enableLogging?: boolean;
}): Application {
	const app = express();

	app.use(requestIdMiddleware);
	app.use(
		cors({
			origin: CONFIG.cors.hosts,
		}),
	);
	if (enableLogging) app.use(loggingMiddleware);
	app.use(
		express.json({
			limit: '100kb',
			strict: true,
		}),
	);

	const walletService = new WalletService(walletRepo);
	const walletController = new WalletController(walletService);
	const healthController = new HealthController(healthCheckRepo);

	app.use('/v1/wallet', walletController.router);
	app.use('/v1/health', healthController.router);

	app.use((req, res) => {
		return res.status(404).json({
			message: 'Resource not found',
			path: req.originalUrl,
			method: req.method,
		});
	});

	app.use(zodErrorHandler);
	app.use(genericErrorHandler);

	return app;
}
