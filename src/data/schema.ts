import { numeric, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

// very simple crud wallet schema
export const walletTable = pgTable('wallet', {
	id: uuid().primaryKey(),
	balance: numeric({ precision: 20, scale: 2 }).notNull().default('0'),
	created: timestamp().notNull().defaultNow(),
	updated: timestamp()
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
