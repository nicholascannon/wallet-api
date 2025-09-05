import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const zodErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
	if (!(err instanceof ZodError)) return next(err);

	return res.status(400).json({
		message: 'Invalid request',
		issues: err.issues,
	});
};
