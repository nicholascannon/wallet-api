import { desc, eq } from 'drizzle-orm';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ConcurrentModificationError } from '../../services/wallet/errors.js';
import type { WalletRepository } from '../../services/wallet/repository.js';
import type { Wallet } from '../../services/wallet/types.js';
import { walletTable } from '../schema.js';

export class PgWalletRepo implements WalletRepository {
	constructor(private db: NodePgDatabase) {}

	async getWallet(walletId: string): Promise<Wallet | undefined> {
		const results = await this.db
			.select()
			.from(walletTable)
			.where(eq(walletTable.wallet_id, walletId))
			.orderBy(desc(walletTable.version))
			.limit(1);

		if (!results[0]) return undefined;

		const row = results[0];
		return {
			id: row.wallet_id,
			balance: Number(row.balance),
			version: Number(row.version),
			updated: row.created, // created is latest transaction created timestamp
		};
	}

	async updateWallet(wallet: Wallet): Promise<void> {
		try {
			await this.db.insert(walletTable).values({
				wallet_id: wallet.id,
				balance: wallet.balance.toString(),
				version: wallet.version.toString(),
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
					throw new ConcurrentModificationError(wallet.id);
				}
			}
			throw error;
		}
	}
}
