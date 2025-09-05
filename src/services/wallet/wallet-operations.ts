import { Decimal } from 'decimal.js';

export function debit(transaction: {
	balance: number;
	amount: number;
}): number {
	const balance = new Decimal(transaction.balance);
	const amount = new Decimal(transaction.amount);

	if (amount.greaterThan(balance)) {
		throw new Error('Insufficient funds'); // TODO: Create custom error class
	}

	return balance.minus(amount).toNumber();
}

export function credit(transaction: {
	balance: number;
	amount: number;
}): number {
	const balance = new Decimal(transaction.balance);
	const amount = new Decimal(transaction.amount);

	return balance.plus(amount).toNumber();
}
