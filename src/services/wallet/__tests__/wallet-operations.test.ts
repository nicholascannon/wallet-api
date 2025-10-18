import { describe, expect, it } from 'vitest';
import { InsufficientFundsError, InvalidDebitAmountError } from '../errors.js';
import { credit, debit } from '../wallet-operations.js';

describe('Wallet operations', () => {
	describe('credit', () => {
		it('should handle zero amount', () => {
			const newBalance = credit({ balance: 100, amount: 0 });
			expect(newBalance).toBe(100);
		});

		it('should handle zero balance', () => {
			const newBalance = credit({ balance: 0, amount: 50 });
			expect(newBalance).toBe(50);
		});

		it('should handle negative amount (should subtract)', () => {
			const newBalance = credit({ balance: 100, amount: -20 });
			expect(newBalance).toBe(80);
		});

		it('should handle floating point precision', () => {
			const newBalance = credit({ balance: 0.1, amount: 0.2 });
			expect(newBalance).toBeCloseTo(0.3, 10);
		});

		it('should handle large numbers', () => {
			const newBalance = credit({ balance: 1e12, amount: 1e12 });
			expect(newBalance).toBe(2e12);
		});
		it('should add amount to wallet balance', () => {
			const newBalance = credit({ balance: 100, amount: 50 });
			expect(newBalance).toBe(150);
		});
	});

	describe('debit', () => {
		it('should handle zero amount', () => {
			const newBalance = debit({ balance: 100, amount: 0 });
			expect(newBalance).toBe(100);
		});

		it('should handle zero balance and zero amount', () => {
			const newBalance = debit({ balance: 0, amount: 0 });
			expect(newBalance).toBe(0);
		});

		it('should throw if amount is negative', () => {
			expect(() => debit({ balance: 100, amount: -10 })).toThrow(
				InvalidDebitAmountError,
			);
		});

		it('should handle floating point precision', () => {
			const newBalance = debit({ balance: 0.3, amount: 0.2 });
			expect(newBalance).toBeCloseTo(0.1, 10);
		});

		it('should handle large numbers', () => {
			const newBalance = debit({ balance: 1e12, amount: 1e11 });
			expect(newBalance).toBe(9e11);
		});
		it('should subtract amount from wallet balance', () => {
			const newBalance = debit({ balance: 100, amount: 40 });
			expect(newBalance).toBe(60);
		});

		it('should throw if amount is greater than balance', () => {
			expect(() => debit({ balance: 100, amount: 200 })).toThrow(
				InsufficientFundsError,
			);
		});
	});
});
