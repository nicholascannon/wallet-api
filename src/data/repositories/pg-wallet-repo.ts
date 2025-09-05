import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { WalletRepository } from '../../services/wallet/repository.js';
import { walletTable } from '../schema.js';

export class PgWalletRepo implements WalletRepository {
	constructor(private db: NodePgDatabase) {}

	async getBalance(walletId: string): Promise<number | undefined> {
		const results = await this.db
			.select({
				balance: walletTable.balance,
			})
			.from(walletTable)
			.where(eq(walletTable.id, walletId))
			.limit(1);

		return results[0]?.balance ? Number(results[0].balance) : undefined;
	}

	async updateBalance(walletId: string, balance: number): Promise<void> {
		await this.db
			.insert(walletTable)
			.values({
				id: walletId,
				balance: balance.toString(),
			})
			.onConflictDoUpdate({
				target: walletTable.id,
				set: { balance: balance.toString() },
			});
	}
}
