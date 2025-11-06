import type { Wallet } from './types.js';

export interface WalletRepository {
	getWallet(walletId: string): Promise<Wallet | undefined>;
	updateWallet(wallet: Wallet): Promise<void>;
}
