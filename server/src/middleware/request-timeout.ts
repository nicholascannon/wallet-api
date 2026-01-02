import type { NextFunction, Request, Response } from 'express';
import { LOGGER } from '../lib/logger.js';

export function requestTimeoutMiddleware(timeout: number) {
	return (req: Request, res: Response, next: NextFunction) => {
		const timeoutId = setTimeout(() => {
			if (!res.headersSent) {
				LOGGER.warn('Request timeout', {
					requestId: req.requestId,
					method: req.method,
					path: req.path,
					timeout,
				});

				res.status(408).json({
					message: 'Request timeout',
					requestId: req.requestId,
				});

				// Destroy the request to free up resources
				req.destroy();
			}
		}, timeout);

		// Clear timeout when response finishes
		const originalEnd = res.end.bind(res);
		res.end = (
			chunk?: unknown,
			encoding?: BufferEncoding | (() => void),
			cb?: () => void,
		) => {
			clearTimeout(timeoutId);

			if (typeof encoding === 'function') {
				return originalEnd(chunk, encoding);
			}
			if (cb) {
				return originalEnd(chunk, encoding as BufferEncoding, cb);
			}
			if (chunk !== undefined) {
				return originalEnd(chunk);
			}
			return originalEnd();
		};

		return next();
	};
}
