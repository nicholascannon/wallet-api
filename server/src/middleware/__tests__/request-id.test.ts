/** biome-ignore-all lint/suspicious/noExplicitAny: testing */
import { describe, expect, it, vi } from 'vitest';
import { requestIdMiddleware } from '../request-id.js';

vi.mock('node:crypto', () => ({
	randomUUID: vi.fn().mockReturnValue('mock-uuid-1234'),
}));

describe('requestIdMiddleware', () => {
	const mockNext = vi.fn();

	describe('source header', () => {
		it('should set req.source to the value of the x-source header', () => {
			const req: any = {
				headers: {
					'x-source': 'test-source',
				},
			};
			const res: any = {};
			requestIdMiddleware(req, res, mockNext);
			expect(req.source).toBe('test-source');
		});

		it('should set req.source to undefined if the x-source header is not present', () => {
			const req: any = {
				headers: {},
			};
			const res: any = {};
			requestIdMiddleware(req, res, mockNext);
			expect(req.source).toBeUndefined();
		});
	});

	describe('requestId header', () => {
		it('should set req.requestId to a random uuid if the x-request-id header is not present', () => {
			const req: any = {
				headers: {},
			};
			const res: any = {};
			requestIdMiddleware(req, res, mockNext);
			expect(req.requestId).toBe('mock-uuid-1234');
		});

		it('should set req.requestId to the value of the x-request-id header if it is present', () => {
			const req: any = {
				headers: {
					'x-request-id': 'test-request-id',
				},
			};
			const res: any = {};
			requestIdMiddleware(req, res, mockNext);
			expect(req.requestId).toBe('test-request-id');
		});
	});

	describe('next function', () => {
		it('should call next function', () => {
			const req: any = {
				headers: {},
			};
			const res: any = {};
			requestIdMiddleware(req, res, mockNext);
			expect(mockNext).toHaveBeenCalled();
		});
	});
});
