import type { Wallet } from './types.js';

export interface WalletRepository {
	getWallet(walletId: string): Promise<Wallet | undefined>;
	upsertWallet(wallet: Wallet): Promise<void>;
}
