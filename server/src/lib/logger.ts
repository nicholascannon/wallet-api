import expressWinston from 'express-winston';
import winston from 'winston';
import { CONFIG } from '../config/env.js';

export const LOGGER = winston.createLogger({
	level: 'info',
	format:
		CONFIG.env === 'development'
			? winston.format.combine(
					winston.format.errors({ stack: true }),
					winston.format.colorize(),
					winston.format.simple(),
				)
			: winston.format.combine(
					winston.format.errors({ stack: true }),
					winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
					winston.format.json(),
				),
	transports: [new winston.transports.Console()],
});

export const loggingMiddleware = expressWinston.logger({
	winstonInstance: LOGGER,
	headerBlacklist: ['authorization', 'cookie'],
	ignoreRoute: (req) => req.path === '/v1/health',
	dynamicMeta: (req, _res) => ({
		requestId: req.requestId,
	}),
});

export const setupProcessLogging = () => {
	process
		.on('uncaughtException', (error) => {
			LOGGER.error('uncaughtException', error);
		})
		.on('unhandledRejection', (reason) => {
			LOGGER.error('unhandledRejection', reason);
		})
		.on('SIGTERM', () => {
			LOGGER.info('SIGTERM received');
		})
		.on('SIGINT', () => {
			LOGGER.info('SIGINT received');
		});
};
