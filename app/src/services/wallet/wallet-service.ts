import { setTimeout } from 'node:timers/promises';
import { LOGGER } from '../../lib/logger.js';
import {
	ConcurrentModificationError,
	InvalidDebitAmountError,
	WalletNotFoundError,
} from './errors.js';
import type { WalletRepository } from './repository.js';
import type { Transaction, Wallet } from './types.js';
import { createWallet, credit, debit } from './wallet-operations.js';

export class WalletService {
	constructor(private readonly repo: WalletRepository) {}

	public async getWallet(walletId: string): Promise<Wallet | undefined> {
		const wallet = await this.repo.getWallet(walletId);
		return wallet ?? createWallet(walletId);
	}

	public async debit(walletId: string, amount: number): Promise<Transaction> {
		if (amount < 0) {
			throw new InvalidDebitAmountError(amount);
		}

		return this.withRetry(async () => {
			const wallet = await this.repo.getWallet(walletId);
			if (!wallet) {
				throw new WalletNotFoundError(walletId);
			}

			const newBalance = debit(wallet, amount);
			const transaction: Transaction = {
				walletId,
				balance: newBalance,
				amount,
				version: wallet.version + 1,
				created: new Date(),
			};

			await this.repo.saveTransaction(transaction);
			return transaction;
		});
	}

	public async credit(
		walletId: string,
		amount: number,
	): Promise<{ created: boolean; transaction: Transaction }> {
		return this.withRetry(async () => {
			const fetchedWallet = await this.repo.getWallet(walletId);
			const created = !fetchedWallet;

			const wallet = fetchedWallet ?? createWallet(walletId);

			const newBalance = credit(wallet, amount);
			const transaction: Transaction = {
				walletId,
				balance: newBalance,
				amount,
				version: wallet.version + 1,
				created: new Date(),
			};

			await this.repo.saveTransaction(transaction);

			if (created) {
				LOGGER.info('Created new wallet', { walletId });
			}

			return { transaction, created };
		});
	}

	private async withRetry<T>(
		operation: () => Promise<T>,
		maxRetries: number = 3,
	): Promise<T> {
		let lastError: Error | undefined;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error as Error;

				if (error instanceof ConcurrentModificationError) {
					if (attempt < maxRetries) {
						await setTimeout(2 ** attempt * 10); // exponential backoff
						continue;
					}
				}

				throw error;
			}
		}

		throw lastError;
	}
}
