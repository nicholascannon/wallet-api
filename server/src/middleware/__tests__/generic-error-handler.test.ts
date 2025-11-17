/** biome-ignore-all lint/suspicious/noExplicitAny: testing */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOGGER } from '../../lib/logger.js';
import { genericErrorHandler } from '../generic-error-handler.js';

vi.mock('../../lib/logger.js', () => ({
	LOGGER: {
		error: vi.fn(),
	},
}));

describe('genericErrorHandler middleware', () => {
	let req: any;
	let res: any;
	let next: any;

	beforeEach(() => {
		req = {
			requestId: 'test-request-id',
		};
		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		};
		next = vi.fn();
		vi.clearAllMocks();
	});

	it('should handle generic error with 500 status and log error', () => {
		const error = new Error('Something went wrong');

		genericErrorHandler(error, req, res, next);

		expect(LOGGER.error).toHaveBeenCalledWith(
			'Error',
			expect.objectContaining({
				message: 'Something went wrong',
				requestId: 'test-request-id',
			}),
		);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Internal server error',
			requestId: 'test-request-id',
		});
		expect(next).not.toHaveBeenCalled();
	});

	describe('JSON parsing errors', () => {
		it('should handle entity.parse.failed error with 400 status', () => {
			const error = { type: 'entity.parse.failed' };

			genericErrorHandler(error, req, res, next);

			expect(LOGGER.error).toHaveBeenCalledWith('Error', {
				type: 'entity.parse.failed',
				requestId: 'test-request-id',
			});
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Invalid request body',
				requestId: 'test-request-id',
			});
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle entity.too.large error with 413 status', () => {
			const error = { type: 'entity.too.large' };

			genericErrorHandler(error, req, res, next);

			expect(LOGGER.error).toHaveBeenCalledWith('Error', {
				type: 'entity.too.large',
				requestId: 'test-request-id',
			});
			expect(res.status).toHaveBeenCalledWith(413);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Request body too large',
				requestId: 'test-request-id',
			});
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle error with different type property with 500 status', () => {
			const error = { type: 'some.other.type' };

			genericErrorHandler(error, req, res, next);

			expect(LOGGER.error).toHaveBeenCalledWith('Error', {
				type: 'some.other.type',
				requestId: 'test-request-id',
			});
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Internal server error',
				requestId: 'test-request-id',
			});
			expect(next).not.toHaveBeenCalled();
		});
	});
});
