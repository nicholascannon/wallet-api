export class WalletNotFoundError extends Error {
	constructor(walletId: string) {
		super(`Wallet not found: ${walletId}`);
		this.name = 'WalletNotFoundError';
	}
}

export class InsufficientFundsError extends Error {
	constructor(availableBalance: number, requestedAmount: number) {
		super(
			`Insufficient funds. Available: ${availableBalance}, Requested: ${requestedAmount}`,
		);
		this.name = 'InsufficientFundsError';
	}
}

export class InvalidDebitAmountError extends Error {
	constructor(amount: number) {
		super(`Debit amount cannot be less than 0: ${amount}`);
		this.name = 'InvalidDebitAmountError';
	}
}

export class ConcurrentModificationError extends Error {
	constructor(walletId: string) {
		super(
			`Wallet ${walletId} was modified by another transaction. Please retry.`,
		);
		this.name = 'ConcurrentModificationError';
	}
}
