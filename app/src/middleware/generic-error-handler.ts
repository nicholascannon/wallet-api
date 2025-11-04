import type { ErrorRequestHandler } from 'express';
import { LOGGER } from '../lib/logger.js';

export const genericErrorHandler: ErrorRequestHandler = (
	error,
	_req,
	res,
	_next,
) => {
	if ('type' in error && error.type === 'entity.parse.failed') {
		return res.status(400).json({ message: 'Invalid request body' });
	}
	if ('type' in error && error.type === 'entity.too.large') {
		return res.status(413).json({ message: 'Request body too large' });
	}

	LOGGER.error({ error });
	return res.status(500).json({ message: 'Internal server error' });
};
