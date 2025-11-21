import {
	bigserial,
	jsonb,
	numeric,
	pgSchema,
	timestamp,
	unique,
	uuid,
} from 'drizzle-orm/pg-core';

const walletSchema = pgSchema('wallet');

export const transactionTypeEnum = walletSchema.enum('transaction_type', [
	'CREDIT',
	'DEBIT',
]);

export const transactionsTable = walletSchema.table(
	'transactions',
	{
		id: bigserial({ mode: 'bigint' }).primaryKey(),
		wallet_id: uuid().notNull(),
		transaction_id: uuid().notNull().unique(),
		type: transactionTypeEnum('type').notNull(),
		balance: numeric({ precision: 20, scale: 2 }).notNull(),
		amount: numeric({ precision: 20, scale: 2 }).notNull(),
		created: timestamp().notNull().defaultNow(),
		version: numeric({ precision: 20, scale: 0 }).notNull(), // For optimistic locking
		metadata: jsonb().notNull().default({}),
	},
	(table) => {
		return [
			unique('wallet_id_version_unique').on(table.wallet_id, table.version),
		];
	},
);
