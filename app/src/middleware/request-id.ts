import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

declare global {
	namespace Express {
		interface Request {
			requestId: string;
			source: string | undefined;
		}
	}
}

export function requestIdMiddleware(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	req.requestId =
		typeof req.headers['x-request-id'] === 'string'
			? req.headers['x-request-id']
			: randomUUID();

	req.source =
		typeof req.headers['x-source'] === 'string'
			? req.headers['x-source']
			: undefined;
	next();
}
