import type { WalletRepository } from '../../services/wallet/repository.js';

export class WalletMemoryRepo implements WalletRepository {
	private wallets = new Map<string, number>();

	async getBalance(walletId: string): Promise<number | undefined> {
		return this.wallets.get(walletId);
	}

	async updateBalance(walletId: string, amount: number): Promise<void> {
		this.wallets.set(walletId, amount);
	}
}
