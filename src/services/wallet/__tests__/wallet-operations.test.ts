import { describe, expect, it } from 'vitest';
import { credit, debit } from '../wallet-operations.js';

describe('Wallet operations', () => {
	describe('credit', () => {
		it('should add amount to wallet balance', () => {
			const newBalance = credit({ balance: 100, amount: 50 });
			expect(newBalance).toBe(150);
		});
	});

	describe('debit', () => {
		it('should subtract amount from wallet balance', () => {
			const newBalance = debit({ balance: 100, amount: 40 });
			expect(newBalance).toBe(60);
		});

		it('should throw if amount is greater than balance', () => {
			expect(() => debit({ balance: 100, amount: 200 })).toThrow(
				'Insufficient funds',
			);
		});
	});
});
