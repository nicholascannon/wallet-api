import { beforeEach, describe, expect, it } from 'vitest';
import { WalletMemoryRepo } from '../../../data/repositories/wallet-memory-repo.js';
import { WalletNotFoundError } from '../errors.js';
import { WalletService } from '../wallet-service.js';

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
			const wallet = {
				id: WALLET_ID,
				balance: 42,
				version: 1,
				created: new Date(),
				updated: new Date(),
			};
			await repo.updateWallet(wallet);

			const balance = await service.getBalance(WALLET_ID);
			expect(balance).toBe(42);
		});
	});

	describe('debit', () => {
		it('throws an error if the wallet does not exist', async () => {
			await expect(service.debit(WALLET_ID, 10)).rejects.toThrow(
				WalletNotFoundError,
			);
		});

		it('debits the wallet and returns the new balance', async () => {
			const wallet = {
				id: WALLET_ID,
				balance: 100,
				version: 1,
				created: new Date(),
				updated: new Date(),
			};
			await repo.updateWallet(wallet);

			const result = await service.debit(WALLET_ID, 30);
			expect(result.balance).toBe(70);
			expect(result.version).toBe(2);
			expect(result.id).toBe(WALLET_ID);
			const balance = await service.getBalance(WALLET_ID);
			expect(balance).toBe(70);
		});
	});

	describe('credit', () => {
		it('creates a new wallet if it does not exist and credits the amount', async () => {
			const result = await service.credit(WALLET_ID, 50);
			expect(result.created).toBe(true);
			expect(result.wallet.balance).toBe(50);
			expect(result.wallet.version).toBe(1);
			expect(result.wallet.id).toBe(WALLET_ID);
			const balance = await service.getBalance(WALLET_ID);
			expect(balance).toBe(50);
		});

		it('credits an existing wallet and returns the new balance', async () => {
			const wallet = {
				id: WALLET_ID,
				balance: 20,
				version: 1,
				created: new Date(),
				updated: new Date(),
			};
			await repo.updateWallet(wallet);

			const result = await service.credit(WALLET_ID, 15);
			expect(result.created).toBe(false);
			expect(result.wallet.balance).toBe(35);
			expect(result.wallet.version).toBe(2);
			expect(result.wallet.id).toBe(WALLET_ID);
			const balance = await service.getBalance(WALLET_ID);
			expect(balance).toBe(35);
		});
	});
});
