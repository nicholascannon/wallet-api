import type { Transaction, Wallet } from './wallet-types.js';

export interface WalletRepository {
	getWallet(walletId: string): Promise<Wallet | undefined>;
	saveTransaction(transaction: Transaction): Promise<void>;
}
