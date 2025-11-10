import type { ErrorRequestHandler } from 'express';
import { LOGGER } from '../lib/logger.js';

export const genericErrorHandler: ErrorRequestHandler = (
	error,
	req,
	res,
	_next,
) => {
	if (typeof error === 'object') {
		error.requestId = req.requestId;
		LOGGER.error('Error', error);
	} else {
		LOGGER.error('Error', { error, requestId: req.requestId });
	}

	if ('type' in error && error.type === 'entity.parse.failed') {
		return res
			.status(400)
			.json({ message: 'Invalid request body', requestId: req.requestId });
	}
	if ('type' in error && error.type === 'entity.too.large') {
		return res
			.status(413)
			.json({ message: 'Request body too large', requestId: req.requestId });
	}

	return res
		.status(500)
		.json({ message: 'Internal server error', requestId: req.requestId });
};
