import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WalletMemoryRepo } from '../../../data/repositories/wallet-memory-repo.js';
import { WalletService } from '../wallet-service.js';

vi.mock('../../../lib/logger.js');

describe('WalletService', () => {
	let repo: WalletMemoryRepo;
	let service: WalletService;
	const WALLET_ID = 'test-wallet';

	beforeEach(() => {
		repo = new WalletMemoryRepo();
		service = new WalletService(repo);
	});

	describe('getBalance', () => {
		it('returns 0 for a wallet that does not exist', async () => {
			const balance = await service.getBalance(WALLET_ID);
			expect(balance).toBe(0);
		});

		it('returns the correct balance for an existing wallet', async () => {
			await repo.updateBalance(WALLET_ID, 42);
			const balance = await service.getBalance(WALLET_ID);
			expect(balance).toBe(42);
		});
	});

	describe('debit', () => {
		it('throws an error if the wallet does not exist', async () => {
			await expect(service.debit(WALLET_ID, 10)).rejects.toThrow(
				'Wallet not found',
			);
		});

		it('debits the wallet and returns the new balance', async () => {
			await repo.updateBalance(WALLET_ID, 100);
			const result = await service.debit(WALLET_ID, 30);
			expect(result.balance).toBe(70);
			const balance = await repo.getBalance(WALLET_ID);
			expect(balance).toBe(70);
		});
	});

	describe('credit', () => {
		it('creates a new wallet if it does not exist and credits the amount', async () => {
			const result = await service.credit(WALLET_ID, 50);
			expect(result.created).toBe(true);
			expect(result.balance).toBe(50);
			const balance = await repo.getBalance(WALLET_ID);
			expect(balance).toBe(50);
		});

		it('credits an existing wallet and returns the new balance', async () => {
			await repo.updateBalance(WALLET_ID, 20);
			const result = await service.credit(WALLET_ID, 15);
			expect(result.created).toBe(false);
			expect(result.balance).toBe(35);
			const balance = await repo.getBalance(WALLET_ID);
			expect(balance).toBe(35);
		});
	});
});
