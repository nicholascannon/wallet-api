import {
	bigserial,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	timestamp,
	unique,
	uuid,
} from 'drizzle-orm/pg-core';

export const transactionTypeEnum = pgEnum('transaction_type', [
	'CREDIT',
	'DEBIT',
]);

export const transactionsTable = pgTable(
	'transactions',
	{
		id: bigserial({ mode: 'bigint' }).primaryKey(),
		wallet_id: uuid().notNull(),
		balance: numeric({ precision: 20, scale: 2 }).notNull(),
		amount: numeric({ precision: 20, scale: 2 }).notNull(),
		created: timestamp().notNull().defaultNow(),
		version: numeric({ precision: 20, scale: 0 }).notNull(), // For optimistic locking
		metadata: jsonb().notNull().default({}),
		type: transactionTypeEnum('type').notNull(),
	},
	(table) => {
		return [
			unique('wallet_id_version_unique').on(table.wallet_id, table.version),
		];
	},
);
