export interface WalletRepository {
	getBalance(walletId: string): Promise<number | undefined>;
	updateBalance(walletId: string, amount: number): Promise<void>;
}
