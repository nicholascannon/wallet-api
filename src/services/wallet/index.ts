import type { Wallet } from './types.js';
import { credit, debit } from './wallet-operations.js';

export class WalletService {
	public async getBalance(_walletId: string): Promise<number> {
		// TODO: get wallet from DB
		return 100;
	}

	public async debit(_walletId: string, amount: number): Promise<Wallet> {
		// TODO: get wallet from DB
		const wallet: Wallet = { id: _walletId, balance: 100 };

		const debitedWallet = debit(wallet, amount);

		// TODO: save wallet to DB

		return debitedWallet;
	}

	public async credit(_walletId: string, amount: number): Promise<Wallet> {
		// TODO: get wallet from DB
		const wallet: Wallet = { id: _walletId, balance: 100 };

		const creditedWallet = credit(wallet, amount);

		// TODO: save wallet to DB

		return creditedWallet;
	}
}
