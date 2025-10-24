import { numeric, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

// very simple crud wallet schema
export const walletTable = pgTable(
	'wallet',
	{
		id: uuid().primaryKey(),
		balance: numeric({ precision: 20, scale: 2 }).notNull().default('0'),
		created: timestamp().notNull().defaultNow(),
		updated: timestamp()
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		version: numeric({ precision: 20, scale: 0 }).notNull().default('0'), // For optimistic locking
	},
	(table) => {
		// Unique constraint to prevent concurrent updates with stale data
		return [unique('wallet_id_version_unique').on(table.id, table.version)];
	},
);
