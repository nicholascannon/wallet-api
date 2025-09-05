import { LOGGER } from '../../lib/logger.js';
import type { WalletRepository } from './repository.js';
import { credit, debit } from './wallet-operations.js';

export class WalletService {
	constructor(private readonly repo: WalletRepository) {}

	public async getBalance(walletId: string): Promise<number> {
		const balance = await this.repo.getBalance(walletId);
		return balance ?? 0;
	}

	public async debit(
		walletId: string,
		amount: number,
	): Promise<{ balance: number }> {
		const balance = await this.repo.getBalance(walletId);
		if (!balance) throw new Error('Wallet not found'); // custom error?

		const debitedBalance = debit({ balance, amount });
		await this.repo.updateBalance(walletId, debitedBalance);

		return { balance: debitedBalance };
	}

	public async credit(
		walletId: string,
		amount: number,
	): Promise<{ created: boolean; balance: number }> {
		const balance = await this.repo.getBalance(walletId);

		const creditedBalance = credit({ balance: balance || 0, amount });
		await this.repo.updateBalance(walletId, creditedBalance);

		if (!balance) LOGGER.info('Created new wallet', { walletId });

		return { created: !balance, balance: creditedBalance };
	}
}
