import { LOGGER } from '../../lib/logger.js';
import { InvalidDebitAmountError, WalletNotFoundError } from './errors.js';
import type { WalletRepository } from './repository.js';
import type { Wallet } from './types.js';
import { credit, debit } from './wallet-operations.js';

export class WalletService {
	constructor(private readonly repo: WalletRepository) {}

	public async getBalance(walletId: string): Promise<number> {
		const wallet = await this.repo.getWallet(walletId);
		return wallet?.balance ?? 0;
	}

	public async debit(
		walletId: string,
		amount: number,
	): Promise<{ balance: number }> {
		if (amount < 0) {
			throw new InvalidDebitAmountError(amount);
		}

		return this.withRetry(async () => {
			const wallet = await this.repo.getWallet(walletId);
			if (!wallet) {
				throw new WalletNotFoundError(walletId);
			}

			const newBalance = debit({ balance: wallet.balance, amount });
			const updatedWallet: Wallet = {
				...wallet,
				balance: newBalance,
				version: wallet.version + 1,
				updated: new Date(),
			};

			await this.repo.upsertWallet(updatedWallet);
			return { balance: newBalance };
		});
	}

	public async credit(
		walletId: string,
		amount: number,
	): Promise<{ created: boolean; balance: number }> {
		return this.withRetry(async () => {
			const wallet = await this.repo.getWallet(walletId);
			const created = !wallet;

			const baseWallet: Wallet = wallet || {
				id: walletId,
				balance: 0,
				version: 0,
				created: new Date(),
				updated: new Date(),
			};

			const newBalance = credit({ balance: baseWallet.balance, amount });

			await this.repo.upsertWallet({
				...baseWallet,
				balance: newBalance,
				version: baseWallet.version + 1,
				updated: new Date(),
			});

			if (created) {
				LOGGER.info('Created new wallet', { walletId });
			}

			return { balance: newBalance, created };
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

				// Check if it's a concurrency conflict
				if (
					error instanceof Error &&
					error.message.includes('modified by another transaction')
				) {
					if (attempt < maxRetries) {
						// Wait a bit before retrying (exponential backoff)
						await new Promise((resolve) =>
							setTimeout(resolve, 2 ** attempt * 10),
						);
						continue;
					}
				}

				// If it's not a concurrency error or we've exhausted retries, re-throw
				throw error;
			}
		}

		throw lastError;
	}
}
