import {
	InsufficientFundsError,
	InvalidDebitAmountError,
} from './wallet-errors.js';
import type { Wallet } from './wallet-types.js';

export function debit(wallet: Wallet, transactionAmount: number): number {
	const balanceCents = Math.round(wallet.balance * 100);
	const amountCents = Math.round(transactionAmount * 100);

	if (amountCents < 0) throw new InvalidDebitAmountError(transactionAmount);
	if (amountCents > balanceCents) {
		throw new InsufficientFundsError(balanceCents / 100, amountCents / 100);
	}

	return (balanceCents - amountCents) / 100;
}

export function credit(wallet: Wallet, transactionAmount: number): number {
	const balanceCents = Math.round(wallet.balance * 100);
	const amountCents = Math.round(transactionAmount * 100);

	return (balanceCents + amountCents) / 100;
}

export function createWallet(walletId: string): Wallet {
	return {
		id: walletId,
		balance: 0,
		version: 0,
		updated: new Date(),
	};
}
