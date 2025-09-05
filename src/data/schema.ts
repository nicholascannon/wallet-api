import { numeric, pgTable, uuid } from 'drizzle-orm/pg-core';

// very simple crud wallet schema
export const walletTable = pgTable('wallet', {
	id: uuid().primaryKey(),
	balance: numeric({ precision: 20, scale: 2 }).notNull().default('0'),
});
