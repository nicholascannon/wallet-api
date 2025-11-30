import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WalletMemoryRepo } from '../../../data/repositories/wallet/wallet-memory-repo.js';
import { WalletNotFoundError } from '../wallet-errors.js';
import { WalletService } from '../wallet-service.js';
import type { Transaction } from '../wallet-types.js';

const TRANSACTION_ID = '0-0-0-0-0';

vi.mock('node:crypto', () => ({
	...vi.importActual('node:crypto'),
	randomUUID: vi.fn(() => TRANSACTION_ID),
}));

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
				transactionId: 'test-transaction-id',
				balance: 42,
				amount: 42,
				version: 1,
				created: new Date(),
				type: 'CREDIT',
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
				transactionId: 'test-transaction-id',
				balance: 100,
				amount: 30,
				version: 1,
				created: new Date(),
				type: 'CREDIT',
			};
			await repo.saveTransaction(transaction);

			const result = await service.debit(WALLET_ID, 30, {
				requestId: 'test-request-id',
				source: 'test-source',
			});

			expect(result).toEqual({
				walletId: WALLET_ID,
				transactionId: TRANSACTION_ID,
				balance: 70,
				amount: 30,
				version: 2,
				created: new Date('2025-01-01T00:00:00.000Z'),
				type: 'DEBIT',
				metadata: { requestId: 'test-request-id', source: 'test-source' },
			});
		});
	});

	describe('credit', () => {
		it('creates a new wallet if it does not exist and credits the amount', async () => {
			const result = await service.credit(WALLET_ID, 50, {
				requestId: 'test-request-id',
				source: 'test-source',
			});

			expect(result).toEqual({
				created: true,
				transaction: {
					balance: 50,
					amount: 50,
					version: 1,
					walletId: WALLET_ID,
					transactionId: TRANSACTION_ID,
					created: new Date('2025-01-01T00:00:00.000Z'),
					type: 'CREDIT',
					metadata: { requestId: 'test-request-id', source: 'test-source' },
				},
			});
		});

		it('credits an existing wallet and returns the new balance', async () => {
			const transaction: Transaction = {
				walletId: WALLET_ID,
				transactionId: 'test-transaction-id',
				balance: 20,
				amount: 15,
				version: 1,
				created: new Date(),
				type: 'CREDIT',
			};
			await repo.saveTransaction(transaction);

			const result = await service.credit(WALLET_ID, 15, {
				requestId: 'test-request-id',
				source: 'test-source',
			});

			expect(result).toEqual({
				created: false,
				transaction: {
					balance: 35,
					amount: 15,
					version: 2,
					walletId: WALLET_ID,
					transactionId: TRANSACTION_ID,
					created: new Date('2025-01-01T00:00:00.000Z'),
					type: 'CREDIT',
					metadata: { requestId: 'test-request-id', source: 'test-source' },
				},
			});
		});
	});
});
