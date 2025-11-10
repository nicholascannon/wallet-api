import { desc, eq } from 'drizzle-orm';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ConcurrentModificationError } from '../../../services/wallet/errors.js';
import type { WalletRepository } from '../../../services/wallet/repository.js';
import type { Transaction, Wallet } from '../../../services/wallet/types.js';
import { transactionsTable } from '../../schema.js';

export class PgWalletRepo implements WalletRepository {
	constructor(private db: NodePgDatabase) {}

	async getWallet(walletId: string): Promise<Wallet | undefined> {
		const results = await this.db
			.select()
			.from(transactionsTable)
			.where(eq(transactionsTable.wallet_id, walletId))
			.orderBy(desc(transactionsTable.version))
			.limit(1);

		if (!results[0]) return undefined;

		const transaction = results[0];
		return {
			id: transaction.wallet_id,
			balance: Number(transaction.balance),
			version: Number(transaction.version),
			updated: transaction.created, // created is latest transaction created timestamp
		};
	}

	async saveTransaction(transaction: Transaction): Promise<void> {
		try {
			await this.db.insert(transactionsTable).values({
				wallet_id: transaction.walletId,
				transaction_id: transaction.transactionId,
				balance: transaction.balance.toString(),
				amount: transaction.amount.toString(),
				version: transaction.version.toString(),
				type: transaction.type,
				metadata: transaction.metadata,
			});
		} catch (error) {
			// Check if it's a unique constraint violation (stale version)
			if (error instanceof DrizzleQueryError) {
				const cause = error.cause;
				if (
					cause &&
					typeof cause === 'object' &&
					'code' in cause &&
					cause.code === '23505'
				) {
					throw new ConcurrentModificationError(transaction.walletId);
				}
			}
			throw error;
		}
	}
}
