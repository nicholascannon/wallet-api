import { LOGGER } from '../../lib/logger.js';
import {
	ConcurrentModificationError,
	InvalidDebitAmountError,
	WalletNotFoundError,
} from './errors.js';
import type { WalletRepository } from './repository.js';
import type { Wallet } from './types.js';
import { credit, debit } from './wallet-operations.js';

export class WalletService {
	constructor(private readonly repo: WalletRepository) {}

	public async getBalance(walletId: string): Promise<number> {
		const wallet = await this.repo.getWallet(walletId);
		return wallet?.balance ?? 0;
	}

	public async debit(walletId: string, amount: number): Promise<Wallet> {
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
			return updatedWallet;
		});
	}

	public async credit(
		walletId: string,
		amount: number,
	): Promise<{ created: boolean; wallet: Wallet }> {
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

			const updatedWallet: Wallet = {
				...baseWallet,
				balance: newBalance,
				version: baseWallet.version + 1,
				updated: new Date(),
			};

			await this.repo.upsertWallet(updatedWallet);

			if (created) {
				LOGGER.info('Created new wallet', { walletId });
			}

			return { wallet: updatedWallet, created };
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
						await new Promise(
							(resolve) => setTimeout(resolve, 2 ** attempt * 10), // exponential backoff
						);
						continue;
					}
				}

				throw error;
			}
		}

		throw lastError;
	}
}
