import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { LOGGER } from '../../lib/logger.js';
import {
	ConcurrentModificationError,
	InvalidDebitAmountError,
	WalletNotFoundError,
} from './wallet-errors.js';
import { createWallet, credit, debit } from './wallet-operations.js';
import type { WalletRepository } from './wallet-repository.js';
import type { Transaction, Wallet } from './wallet-types.js';

export class WalletService {
	constructor(private readonly repo: WalletRepository) {}

	public async getWallet(walletId: string): Promise<Wallet> {
		const wallet = await this.repo.getWallet(walletId);
		return wallet ?? createWallet(walletId);
	}

	public async debit(
		walletId: string,
		amount: number,
		metadata?: Transaction['metadata'],
	): Promise<Transaction> {
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
				transactionId: randomUUID(),
				balance: newBalance,
				amount,
				version: wallet.version + 1,
				created: new Date(),
				type: 'DEBIT',
				metadata,
			};

			await this.repo.saveTransaction(transaction);

			LOGGER.info('DEBIT', {
				walletId,
				transactionId: transaction.transactionId,
				amount,
			});

			return transaction;
		});
	}

	public async credit(
		walletId: string,
		amount: number,
		metadata?: Transaction['metadata'],
	): Promise<{ created: boolean; transaction: Transaction }> {
		return this.withRetry(async () => {
			const fetchedWallet = await this.repo.getWallet(walletId);
			const created = !fetchedWallet;

			const wallet = fetchedWallet ?? createWallet(walletId);

			const newBalance = credit(wallet, amount);
			const transaction: Transaction = {
				walletId,
				transactionId: randomUUID(),
				balance: newBalance,
				amount,
				version: wallet.version + 1,
				created: new Date(),
				type: 'CREDIT',
				metadata,
			};

			await this.repo.saveTransaction(transaction);

			if (created) {
				LOGGER.info('CREDIT - NEW WALLET', {
					walletId,
					transactionId: transaction.transactionId,
					amount,
				});
			} else {
				LOGGER.info('CREDIT', {
					walletId,
					transactionId: transaction.transactionId,
					amount,
				});
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
