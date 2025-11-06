import { Decimal } from 'decimal.js';
import { InsufficientFundsError, InvalidDebitAmountError } from './errors.js';
import type { Wallet } from './types.js';

export function debit(wallet: Wallet, transactionAmount: number): number {
	const balance = new Decimal(wallet.balance);
	const amount = new Decimal(transactionAmount);

	if (amount.lessThan(0)) throw new InvalidDebitAmountError(amount.toNumber());
	if (amount.greaterThan(balance)) {
		throw new InsufficientFundsError(balance.toNumber(), amount.toNumber());
	}

	return balance.minus(amount).toNumber();
}

export function credit(wallet: Wallet, transactionAmount: number): number {
	const balance = new Decimal(wallet.balance);
	const amount = new Decimal(transactionAmount);

	return balance.plus(amount).toNumber();
}

export function createWallet(walletId: string): Wallet {
	return {
		id: walletId,
		balance: 0,
		version: 0,
		updated: new Date(),
	};
}
