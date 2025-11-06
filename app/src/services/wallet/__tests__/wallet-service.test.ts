import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WalletMemoryRepo } from '../../../data/repositories/wallet/wallet-memory-repo.js';
import { WalletNotFoundError } from '../errors.js';
import type { Transaction } from '../types.js';
import { WalletService } from '../wallet-service.js';

describe('WalletService', () => {
	let repo: WalletMemoryRepo;
	let service: WalletService;
	const WALLET_ID = 'test-wallet';

	beforeEach(() => {
		repo = new WalletMemoryRepo();
		service = new WalletService(repo);
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('getWallet', () => {
		it('returns 0 for a wallet that does not exist', async () => {
			const wallet = await service.getWallet(WALLET_ID);
			expect(wallet).toEqual({
				id: WALLET_ID,
				balance: 0,
				version: 0,
				updated: new Date('2025-01-01T00:00:00.000Z'),
			});
		});

		it('returns the correct balance for an existing wallet', async () => {
			const transaction: Transaction = {
				walletId: WALLET_ID,
				balance: 42,
				amount: 42,
				version: 1,
				created: new Date(),
			};
			await repo.saveTransaction(transaction);

			const wallet = await service.getWallet(WALLET_ID);
			expect(wallet).toEqual({
				id: WALLET_ID,
				balance: 42,
				version: 1,
				updated: new Date('2025-01-01T00:00:00.000Z'),
			});
		});
	});

	describe('debit', () => {
		it('throws an error if the wallet does not exist', async () => {
			await expect(service.debit(WALLET_ID, 10)).rejects.toThrow(
				WalletNotFoundError,
			);
		});

		it('debits the wallet and returns the new balance', async () => {
			const transaction: Transaction = {
				walletId: WALLET_ID,
				balance: 100,
				amount: 30,
				version: 1,
				created: new Date(),
			};
			await repo.saveTransaction(transaction);

			const result = await service.debit(WALLET_ID, 30);
			expect(result.balance).toBe(70);
			expect(result.version).toBe(2);
			expect(result.walletId).toBe(WALLET_ID);
			const wallet = await service.getWallet(WALLET_ID);
			expect(wallet?.balance).toBe(70);
		});
	});

	describe('credit', () => {
		it('creates a new wallet if it does not exist and credits the amount', async () => {
			const result = await service.credit(WALLET_ID, 50);
			expect(result.created).toBe(true);
			expect(result.transaction.balance).toBe(50);
			expect(result.transaction.version).toBe(1);
			expect(result.transaction.walletId).toBe(WALLET_ID);
			const wallet = await service.getWallet(WALLET_ID);
			expect(wallet?.balance).toBe(50);
		});

		it('credits an existing wallet and returns the new balance', async () => {
			const transaction: Transaction = {
				walletId: WALLET_ID,
				balance: 20,
				amount: 15,
				version: 1,
				created: new Date(),
			};
			await repo.saveTransaction(transaction);

			const result = await service.credit(WALLET_ID, 15);
			expect(result.created).toBe(false);
			expect(result.transaction.balance).toBe(35);
			expect(result.transaction.version).toBe(2);
			expect(result.transaction.walletId).toBe(WALLET_ID);
			const wallet = await service.getWallet(WALLET_ID);
			expect(wallet?.balance).toBe(35);
		});
	});
});
