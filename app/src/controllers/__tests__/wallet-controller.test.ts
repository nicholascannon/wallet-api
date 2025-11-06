import type { Application } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import { HealthCheckMemoryRepo } from '../../data/repositories/health-check-memory-repo.js';
import { WalletMemoryRepo } from '../../data/repositories/wallet-memory-repo.js';

const NOW = new Date('2025-01-01T00:00:00.000Z');

describe('WalletController', () => {
	let app: Application;
	const walletId = '123e4567-e89b-12d3-a456-426614174000';

	beforeEach(() => {
		app = createApp({
			walletRepo: new WalletMemoryRepo(),
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
				balance: 0,
				version: 0,
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
				balance: 100,
				version: 1,
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
				.send({ amount: 50 });
			expect(res.status).toBe(201);
			expect(res.body).toEqual({ balance: 50 });
		});

		it('returns 200 and updated balance for existing wallet', async () => {
			await request(app)
				.post(`/v1/wallet/${walletId}/credit`)
				.send({ amount: 10 });
			const res = await request(app)
				.post(`/v1/wallet/${walletId}/credit`)
				.send({ amount: 5 });
			expect(res.status).toBe(200);
			expect(res.body).toEqual({ balance: 15 });
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
	});

	describe('POST /wallet/:id/debit', () => {
		it('returns 200 and debited balance for valid request', async () => {
			await request(app)
				.post(`/v1/wallet/${walletId}/credit`)
				.send({ amount: 20 });
			const res = await request(app)
				.post(`/v1/wallet/${walletId}/debit`)
				.send({ amount: 5 });
			expect(res.status).toBe(200);
			expect(res.body).toEqual({ balance: 15 });
		});

		it('returns 400 and message for insufficient funds', async () => {
			// Credit wallet with 5, then try to debit 10
			await request(app)
				.post(`/v1/wallet/${walletId}/credit`)
				.send({ amount: 5 });
			const res = await request(app)
				.post(`/v1/wallet/${walletId}/debit`)
				.send({ amount: 10 });
			expect(res.status).toBe(400);
			expect(res.body.message).toContain('Insufficient funds');
		});

		it('returns 404 and message for wallet not found', async () => {
			// Use a new walletId that does not exist and try to debit
			const nonExistentId = '123e4567-e89b-12d3-a456-426614174111';
			const res = await request(app)
				.post(`/v1/wallet/${nonExistentId}/debit`)
				.send({ amount: 10 });
			expect(res.status).toBe(404);
			expect(res.body.message).toContain('Wallet not found');
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
	});
});
