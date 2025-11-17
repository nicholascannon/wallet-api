export interface Transaction {
	walletId: string;
	transactionId: string;
	balance: number; // number is sufficient for database precision (20,2)
	amount: number;
	version: number;
	created: Date;
	type: 'CREDIT' | 'DEBIT';
	metadata?:
		| Record<string, string | number | boolean | null | undefined>
		| undefined;
}

export interface Wallet {
	id: string;
	balance: number;
	version: number;
	updated: Date;
}
