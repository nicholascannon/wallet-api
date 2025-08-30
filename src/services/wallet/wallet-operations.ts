import type { Wallet } from './types.js';

export function debit(wallet: Wallet, amount: number): Wallet {
	if (amount > wallet.balance) {
		throw new Error('Insufficient funds'); // TODO: Create custom error class
	}

	return { ...wallet, balance: wallet.balance - amount };
}

export function credit(wallet: Wallet, amount: number): Wallet {
	return { ...wallet, balance: wallet.balance + amount };
}
