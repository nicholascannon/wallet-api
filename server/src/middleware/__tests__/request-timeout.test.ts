/** biome-ignore-all lint/suspicious/noExplicitAny: testing */

import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOGGER } from '../../lib/logger.js';
import { requestTimeoutMiddleware } from '../request-timeout.js';

vi.mock('../../lib/logger.js', () => ({
	LOGGER: {
		warn: vi.fn(),
	},
}));

const TIMEOUT = 30_000;

describe('requestTimeoutMiddleware', () => {
	let req: any;
	let res: any;
	let next: any;
	let middleware: (req: Request, res: Response, next: NextFunction) => void;

	beforeEach(() => {
		vi.useFakeTimers();
		req = {
			requestId: 'test-request-id',
			method: 'GET',
			path: '/v1/wallet',
			destroy: vi.fn(),
		};
		res = {
			headersSent: false,
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
			end: vi.fn(),
		};
		next = vi.fn();
		vi.clearAllMocks();
		middleware = requestTimeoutMiddleware(TIMEOUT);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should call next function immediately', () => {
		middleware(req, res, next);
		expect(next).toHaveBeenCalled();
	});

	it('should timeout and send 408 response after 30 seconds', () => {
		middleware(req, res, next);

		// Fast-forward 30 seconds
		vi.advanceTimersByTime(30_000);

		expect(LOGGER.warn).toHaveBeenCalledWith('Request timeout', {
			requestId: 'test-request-id',
			method: 'GET',
			path: '/v1/wallet',
			timeout: 30_000,
		});
		expect(res.status).toHaveBeenCalledWith(408);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Request timeout',
			requestId: 'test-request-id',
		});
		expect(req.destroy).toHaveBeenCalled();
	});

	it('should not timeout if response ends before 30 seconds', () => {
		middleware(req, res, next);

		// Fast-forward 20 seconds
		vi.advanceTimersByTime(20_000);

		// End the response
		res.end();

		// Fast-forward another 15 seconds (total 35 seconds)
		vi.advanceTimersByTime(15_000);

		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
		expect(req.destroy).not.toHaveBeenCalled();
		expect(LOGGER.warn).not.toHaveBeenCalled();
	});

	it('should not timeout if headers are already sent', () => {
		res.headersSent = true;
		middleware(req, res, next);

		// Fast-forward 30 seconds
		vi.advanceTimersByTime(30_000);

		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
		expect(req.destroy).not.toHaveBeenCalled();
		expect(LOGGER.warn).not.toHaveBeenCalled();
	});

	it('should clear timeout when response ends with chunk', () => {
		middleware(req, res, next);

		// End the response with a chunk
		res.end('response data');

		// Fast-forward 30 seconds
		vi.advanceTimersByTime(30_000);

		expect(res.status).not.toHaveBeenCalled();
		expect(req.destroy).not.toHaveBeenCalled();
	});

	it('should clear timeout when response ends with encoding callback', () => {
		middleware(req, res, next);
		const callback = vi.fn();

		// End the response with encoding and callback
		res.end('data', 'utf8', callback);

		// Fast-forward 30 seconds
		vi.advanceTimersByTime(30_000);

		expect(res.status).not.toHaveBeenCalled();
		expect(req.destroy).not.toHaveBeenCalled();
	});

	it('should not timeout before 30 seconds', () => {
		middleware(req, res, next);

		// Fast-forward 29 seconds
		vi.advanceTimersByTime(29_000);

		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
		expect(req.destroy).not.toHaveBeenCalled();
		expect(LOGGER.warn).not.toHaveBeenCalled();
	});

	it('should preserve original end function behavior', () => {
		const originalEnd = res.end;
		middleware(req, res, next);

		// Verify end is still callable
		expect(typeof res.end).toBe('function');
		expect(res.end).not.toBe(originalEnd);

		// Call the wrapped end function
		res.end();

		// Original end should have been called
		expect(originalEnd).toHaveBeenCalled();
	});
});
