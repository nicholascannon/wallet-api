import type { WalletRepository } from '../../services/wallet/repository.js';
import type { Transaction, Wallet } from '../../services/wallet/types.js';

export class WalletMemoryRepo implements WalletRepository {
	private transactions = new Map<string, Transaction>();

	async getWallet(walletId: string): Promise<Wallet | undefined> {
		const transaction = this.transactions.get(walletId);
		if (!transaction) return undefined;
		return {
			id: transaction.walletId,
			balance: transaction.balance,
			version: transaction.version,
			updated: transaction.created,
		};
	}

	async saveTransaction(transaction: Transaction): Promise<void> {
		this.transactions.set(transaction.walletId, transaction);
	}
}
