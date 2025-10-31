export interface Wallet {
	id: string;
	balance: number; // number is sufficient for database precision (20,2)
	version: number;
	created: Date;
	updated: Date;
}
