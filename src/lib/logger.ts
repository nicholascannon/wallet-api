import winston from 'winston';
import expressWinston from 'express-winston';

export const LOGGER = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export const loggingMiddleware = expressWinston.logger({
  winstonInstance: LOGGER,
  headerBlacklist: ['authorization', 'cookie'],
  ignoreRoute: (req) => req.path === '/healthcheck',
});
