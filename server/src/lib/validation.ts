import * as z from 'zod';

/**
 * Zod schema that validates a money string has exactly two decimal places.
 * Accepts strings like "10.50", "0.01", "100.00", "0.99"
 * Rejects strings like "10.5", "0.001", "10.500", "0.0100000000000000002"
 */
export const money = z
	.string()
	.regex(/^\d+(\.\d{2})?$/, {
		message: 'Money must have exactly 2 decimal places',
	})
	.transform(Number);
