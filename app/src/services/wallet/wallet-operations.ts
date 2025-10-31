import { Decimal } from 'decimal.js';
import { InsufficientFundsError, InvalidDebitAmountError } from './errors.js';

export function debit(transaction: {
	balance: number;
	amount: number;
}): number {
	const balance = new Decimal(transaction.balance);
	const amount = new Decimal(transaction.amount);

	if (amount.lessThan(0)) throw new InvalidDebitAmountError(amount.toNumber());
	if (amount.greaterThan(balance)) {
		throw new InsufficientFundsError(balance.toNumber(), amount.toNumber());
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
