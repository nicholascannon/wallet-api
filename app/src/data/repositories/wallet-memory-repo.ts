import type { WalletRepository } from '../../services/wallet/repository.js';
import type { Wallet } from '../../services/wallet/types.js';

export class WalletMemoryRepo implements WalletRepository {
	private wallets = new Map<string, Wallet>();

	async getWallet(walletId: string): Promise<Wallet | undefined> {
		return this.wallets.get(walletId);
	}

	async upsertWallet(wallet: Wallet): Promise<void> {
		this.wallets.set(wallet.id, wallet);
	}
}
