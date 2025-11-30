import type { Application } from 'express';
import request from 'supertest';
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from 'vitest';
import { createApp } from '../../app.js';
import { HealthCheckMemoryRepo } from '../../data/repositories/health/health-check-memory-repo.js';
import { WalletMemoryRepo } from '../../data/repositories/wallet/wallet-memory-repo.js';

const NOW = new Date('2025-01-01T00:00:00.000Z');
const REQUEST_ID = 'test-request-id';
const SOURCE = 'test-source';
const TRANSACTION_ID = '0-0-0-0-0';

vi.mock('node:crypto', () => ({
	...vi.importActual('node:crypto'),
	randomUUID: vi.fn(() => TRANSACTION_ID),
}));

describe('WalletController', () => {
	let app: Application;
	let walletRepo: WalletMemoryRepo;
	let saveTransactionSpy: Mock;
	const walletId = '123e4567-e89b-12d3-a456-426614174000';

	beforeEach(() => {
		walletRepo = new WalletMemoryRepo();
		saveTransactionSpy = vi.spyOn(walletRepo, 'saveTransaction');

		app = createApp({
			walletRepo,
			healthCheckRepo: new HealthCheckMemoryRepo(),
			enableLogging: false,
		});

		vi.useFakeTimers({
			toFake: ['Date'], // supertest depends on other timers
		});
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('GET /wallet/:id', () => {
		it('returns 0 for a new wallet', async () => {
			const res = await request(app).get(`/v1/wallet/${walletId}`);
			expect(res.status).toBe(200);
			expect(res.body).toEqual({
				id: walletId,
				balance: '0.00',
				updated: NOW.toISOString(),
			});
		});

		it('returns 200 and balance for valid wallet', async () => {
			// First, credit the wallet so it exists
			await request(app)
				.post(`/v1/wallet/${walletId}/credit`)
				.send({ amount: 100 });

			const res = await request(app).get(`/v1/wallet/${walletId}`);
			expect(res.status).toBe(200);
			expect(res.body).toEqual({
				id: walletId,
				balance: '100.00',
				updated: NOW.toISOString(),
			});
		});

		it('returns 400 for invalid wallet id', async () => {
			const res = await request(app).get('/v1/wallet/not-a-uuid');
			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty('message', 'Invalid request');
			expect(res.body).toHaveProperty('issues');
		});
	});

	describe('POST /wallet/:id/credit', () => {
		it('returns 201 and balance for new wallet', async () => {
			const res = await request(app)
				.post(`/v1/wallet/${walletId}/credit`)
				.set('x-request-id', REQUEST_ID)
				.set('x-source', SOURCE)
				.send({ amount: 50 });

			expect(saveTransactionSpy).toHaveBeenCalledWith({
				walletId,
				transactionId: TRANSACTION_ID,
				balance: 50,
				amount: 50,
				version: 1,
				created: NOW,
				type: 'CREDIT',
				metadata: { requestId: REQUEST_ID, source: SOURCE },
			});
			expect(res.status).toBe(201);
			expect(res.body).toEqual({
				balance: '50.00',
				requestId: REQUEST_ID,
				transactionId: TRANSACTION_ID,
			});
		});

		it('returns 200 and updated balance for existing wallet', async () => {
			await request(app)
				.post(`/v1/wallet/${walletId}/credit`)
				.send({ amount: 10 });

			const res = await request(app)
				.post(`/v1/wallet/${walletId}/credit`)
				.set('x-request-id', REQUEST_ID)
				.set('x-source', SOURCE)
				.send({ amount: 5 });

			expect(saveTransactionSpy).toHaveBeenCalledWith({
				walletId,
				transactionId: TRANSACTION_ID,
				balance: 15,
				amount: 5,
				version: 2,
				created: NOW,
				type: 'CREDIT',
				metadata: { requestId: REQUEST_ID, source: SOURCE },
			});
			expect(res.status).toBe(200);
			expect(res.body).toEqual({
				balance: '15.00',
				requestId: REQUEST_ID,
				transactionId: TRANSACTION_ID,
			});
		});

		it('returns 400 for invalid wallet id', async () => {
			const res = await request(app)
				.post('/v1/wallet/not-a-uuid/credit')
				.send({ amount: 10 });

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty('message', 'Invalid request');
		});

		it('returns 400 for invalid amount', async () => {
			const res = await request(app)
				.post(`/v1/wallet/${walletId}/credit`)
				.send({ amount: -5 });

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty('message', 'Invalid request');
		});

		it('should pass metadata to the transaction', async () => {
			await request(app)
				.post(`/v1/wallet/${walletId}/credit`)
				.set('x-request-id', REQUEST_ID)
				.set('x-source', SOURCE)
				.send({ amount: 10, metadata: { test: 'test' } });

			expect(saveTransactionSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					metadata: { test: 'test', requestId: REQUEST_ID, source: SOURCE },
				}),
			);
		});
	});

	describe('POST /wallet/:id/debit', () => {
		it('returns 200 and debited balance for valid request', async () => {
			walletRepo.saveTransaction({
				walletId,
				transactionId: TRANSACTION_ID,
				balance: 20,
				amount: 20,
				version: 1,
				created: NOW,
				type: 'CREDIT',
			});

			const res = await request(app)
				.post(`/v1/wallet/${walletId}/debit`)
				.set('x-request-id', REQUEST_ID)
				.set('x-source', SOURCE)
				.send({ amount: 5 });

			expect(saveTransactionSpy).toHaveBeenCalledWith({
				walletId,
				transactionId: TRANSACTION_ID,
				balance: 15,
				amount: 5,
				version: 2,
				created: NOW,
				type: 'DEBIT',
				metadata: { requestId: REQUEST_ID, source: SOURCE },
			});
			expect(res.status).toBe(200);
			expect(res.body).toEqual({
				balance: '15.00',
				requestId: REQUEST_ID,
				transactionId: TRANSACTION_ID,
			});
		});

		it('returns 400 and message for insufficient funds', async () => {
			// Credit wallet with 5, then try to debit 10
			walletRepo.saveTransaction({
				walletId,
				transactionId: TRANSACTION_ID,
				balance: 5,
				amount: 5,
				version: 1,
				created: NOW,
				type: 'CREDIT',
			});

			const res = await request(app)
				.post(`/v1/wallet/${walletId}/debit`)
				.set('x-request-id', REQUEST_ID)
				.set('x-source', SOURCE)
				.send({ amount: 10 });

			expect(res.status).toBe(400);
			expect(res.body).toEqual({
				message: 'Insufficient funds. Available: 5, Requested: 10',
				error: 'INSUFFICIENT_FUNDS',
				availableBalance: '5.00',
				requestedAmount: '10.00',
			});
		});

		it('returns 404 and message for wallet not found', async () => {
			// Use a new walletId that does not exist and try to debit
			const nonExistentId = '123e4567-e89b-12d3-a456-426614174111';

			const res = await request(app)
				.post(`/v1/wallet/${nonExistentId}/debit`)
				.send({ amount: 10 });

			expect(res.status).toBe(404);
			expect(res.body).toEqual({
				message: `Wallet not found: ${nonExistentId}`,
				error: 'WALLET_NOT_FOUND',
				walletId: nonExistentId,
			});
		});

		it('returns 400 for invalid wallet id', async () => {
			const res = await request(app)
				.post('/v1/wallet/not-a-uuid/debit')
				.send({ amount: 5 });

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty('message', 'Invalid request');
		});

		it('returns 400 for invalid amount', async () => {
			const res = await request(app)
				.post(`/v1/wallet/${walletId}/debit`)
				.send({ amount: 0 });

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty('message', 'Invalid request');
		});

		it('should pass metadata to the transaction', async () => {
			walletRepo.saveTransaction({
				walletId,
				transactionId: TRANSACTION_ID,
				balance: 20,
				amount: 20,
				version: 1,
				created: NOW,
				type: 'CREDIT',
			});

			await request(app)
				.post(`/v1/wallet/${walletId}/debit`)
				.set('x-request-id', REQUEST_ID)
				.set('x-source', SOURCE)
				.send({ amount: 10, metadata: { test: 'test' } });

			expect(saveTransactionSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					metadata: { test: 'test', requestId: REQUEST_ID, source: SOURCE },
				}),
			);
		});
	});
});
