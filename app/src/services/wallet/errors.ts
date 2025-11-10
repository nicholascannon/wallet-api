export class WalletNotFoundError extends Error {
	constructor(public readonly walletId: string) {
		super(`Wallet not found: ${walletId}`);
		this.name = 'WalletNotFoundError';
	}
}

export class InsufficientFundsError extends Error {
	constructor(
		public readonly availableBalance: number,
		public readonly requestedAmount: number,
	) {
		super(
			`Insufficient funds. Available: ${availableBalance}, Requested: ${requestedAmount}`,
		);
		this.name = 'InsufficientFundsError';
	}
}

export class InvalidDebitAmountError extends Error {
	constructor(public readonly amount: number) {
		super(`Debit amount cannot be less than 0: ${amount}`);
		this.name = 'InvalidDebitAmountError';
	}
}

export class ConcurrentModificationError extends Error {
	constructor(public readonly walletId: string) {
		super(
			`Wallet ${walletId} was modified by another transaction. Please retry.`,
		);
		this.name = 'ConcurrentModificationError';
	}
}
