import type { ErrorRequestHandler } from 'express';
import { LOGGER } from '../lib/logger.js';

export const genericErrorHandler: ErrorRequestHandler = (
	err,
	_req,
	res,
	_next,
) => {
	if ('type' in err && err.type === 'entity.parse.failed') {
		return res.status(400).json({ message: 'Invalid request body' });
	}
	if ('type' in err && err.type === 'entity.too.large') {
		return res.status(413).json({ message: 'Request body too large' });
	}

	LOGGER.error(err);
	return res.status(500).json({ message: 'Internal server error' });
};
