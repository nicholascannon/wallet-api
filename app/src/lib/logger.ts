import expressWinston from 'express-winston';
import winston from 'winston';

export const LOGGER = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		winston.format.json(),
	),
	transports: [new winston.transports.Console()],
});

export const loggingMiddleware = expressWinston.logger({
	winstonInstance: LOGGER,
	headerBlacklist: ['authorization', 'cookie'],
	ignoreRoute: (req) => req.path === '/healthcheck',
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
