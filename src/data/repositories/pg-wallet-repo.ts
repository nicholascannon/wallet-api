import { eq } from 'drizzle-orm';
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
			.where(eq(walletTable.id, walletId))
			.limit(1);

		if (!results[0]) return undefined;

		const row = results[0];
		return {
			id: row.id,
			balance: Number(row.balance),
			version: Number(row.version),
			created: row.created,
			updated: row.updated,
		};
	}

	async upsertWallet(wallet: Wallet): Promise<void> {
		try {
			await this.db
				.insert(walletTable)
				.values({
					id: wallet.id,
					balance: wallet.balance.toString(),
					version: wallet.version.toString(),
					created: wallet.created,
					updated: wallet.updated,
				})
				.onConflictDoUpdate({
					target: walletTable.id,
					set: {
						balance: wallet.balance.toString(),
						version: wallet.version.toString(),
						updated: wallet.updated,
					},
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
