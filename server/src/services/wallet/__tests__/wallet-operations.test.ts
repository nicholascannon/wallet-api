import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	InsufficientFundsError,
	InvalidDebitAmountError,
} from '../wallet-errors.js';
import { createWallet, credit, debit } from '../wallet-operations.js';

describe('Wallet operations', () => {
	describe('credit', () => {
		it('should handle zero amount', () => {
			const newBalance = credit(100, 0);
			expect(newBalance).toBe(100);
		});

		it('should handle zero balance', () => {
			const newBalance = credit(0, 50);
			expect(newBalance).toBe(50);
		});

		it('should handle negative amount (should subtract)', () => {
			const newBalance = credit(100, -20);
			expect(newBalance).toBe(80);
		});

		it('should handle floating point precision', () => {
			const newBalance = credit(0.1, 0.2);
			expect(newBalance).toBe(0.3);
		});

		it('should handle classic floating point precision issue (0.1 + 0.2)', () => {
			const newBalance = credit(0.1, 0.2);
			expect(newBalance).toBe(0.3);
			expect(newBalance).not.toBe(0.30000000000000004);
		});

		it('should handle multiple small additions without precision drift', () => {
			let balance = 0;
			balance = credit(balance, 0.1);
			balance = credit(balance, 0.1);
			balance = credit(balance, 0.1);
			expect(balance).toBe(0.3);
			expect(balance).not.toBe(0.30000000000000004);
		});

		it('should handle values with more than 2 decimal places (rounding)', () => {
			const newBalance = credit(100.0, 0.001);
			expect(newBalance).toBe(100.0);
		});

		it('should handle values with more than 2 decimal places that round up', () => {
			const newBalance = credit(100.0, 0.005);
			expect(newBalance).toBe(100.01);
		});

		it('should handle minimum transaction amount (0.01)', () => {
			const newBalance = credit(0, 0.01);
			expect(newBalance).toBe(0.01);
		});

		it('should handle maximum transaction amount (1,000,000)', () => {
			const newBalance = credit(0, 1_000_000);
			expect(newBalance).toBe(1_000_000);
		});

		it('should handle very small amounts that sum to whole numbers', () => {
			let balance = 0;
			// Add 0.33 three times - should equal 0.99, not 0.9900000000000001
			balance = credit(balance, 0.33);
			balance = credit(balance, 0.33);
			balance = credit(balance, 0.33);
			expect(balance).toBe(0.99);
		});

		it('should handle fractional cents correctly', () => {
			const newBalance = credit(10.5, 0.49);
			expect(newBalance).toBe(10.99);
		});

		it('should handle large numbers', () => {
			const newBalance = credit(1e12, 1e12);
			expect(newBalance).toBe(2e12);
		});

		it('should handle large numbers with decimals', () => {
			const newBalance = credit(999999.99, 0.01);
			expect(newBalance).toBe(1_000_000.0);
		});

		it('should add amount to wallet balance', () => {
			const newBalance = credit(100, 50);
			expect(newBalance).toBe(150);
		});

		it('should handle values that result in exactly zero', () => {
			const newBalance = credit(-50, 50);
			expect(newBalance).toBe(0);
		});
	});

	describe('debit', () => {
		it('should handle zero amount', () => {
			const newBalance = debit(100, 0);
			expect(newBalance).toBe(100);
		});

		it('should handle zero balance and zero amount', () => {
			const newBalance = debit(0, 0);
			expect(newBalance).toBe(0);
		});

		it('should throw if amount is negative', () => {
			expect(() => debit(100, -10)).toThrow(InvalidDebitAmountError);
		});

		it('should handle floating point precision', () => {
			const newBalance = debit(0.3, 0.2);
			expect(newBalance).toBe(0.1);
		});

		it('should handle classic floating point precision issue (0.3 - 0.2)', () => {
			const newBalance = debit(0.3, 0.2);
			expect(newBalance).toBe(0.1);
			expect(newBalance).not.toBe(0.09999999999999998);
		});

		it('should handle multiple small subtractions without precision drift', () => {
			let balance = 0.3;
			balance = debit(balance, 0.1);
			balance = debit(balance, 0.1);
			balance = debit(balance, 0.1);
			expect(balance).toBe(0);
		});

		it('should handle values with more than 2 decimal places (rounding)', () => {
			const newBalance = debit(100.0, 0.001);
			expect(newBalance).toBe(100.0);
		});

		it('should handle values with more than 2 decimal places that round up', () => {
			const newBalance = debit(100.01, 0.005);
			expect(newBalance).toBe(100.0);
		});

		it('should handle minimum transaction amount (0.01)', () => {
			const newBalance = debit(1.0, 0.01);
			expect(newBalance).toBe(0.99);
		});

		it('should handle maximum transaction amount (1,000,000)', () => {
			const newBalance = debit(2_000_000, 1_000_000);
			expect(newBalance).toBe(1_000_000);
		});

		it('should handle very small amounts that subtract to whole numbers', () => {
			let balance = 0.99;
			// Subtract 0.33 three times - should equal 0, not -0.0000000000000001
			balance = debit(balance, 0.33);
			balance = debit(balance, 0.33);
			balance = debit(balance, 0.33);
			expect(balance).toBe(0);
		});

		it('should handle fractional cents correctly', () => {
			const newBalance = debit(10.99, 0.49);
			expect(newBalance).toBe(10.5);
		});

		it('should handle exact balance debit', () => {
			const newBalance = debit(100.0, 100.0);
			expect(newBalance).toBe(0);
		});

		it('should handle large numbers', () => {
			const newBalance = debit(1e12, 1e11);
			expect(newBalance).toBe(9e11);
		});

		it('should handle large numbers with decimals', () => {
			const newBalance = debit(1_000_000.0, 0.01);
			expect(newBalance).toBe(999_999.99);
		});

		it('should subtract amount from wallet balance', () => {
			const newBalance = debit(100, 40);
			expect(newBalance).toBe(60);
		});

		it('should throw if amount is greater than balance', () => {
			expect(() => debit(100, 200)).toThrow(InsufficientFundsError);
		});

		it('should throw if amount is greater than balance by small amount', () => {
			expect(() => debit(100.0, 100.01)).toThrow(InsufficientFundsError);
		});

		it('should throw if amount is greater than balance with floating point precision issues', () => {
			expect(() => debit(0.1, 0.2)).toThrow(InsufficientFundsError);
		});
	});

	describe('floating point precision edge cases', () => {
		it('should handle accumulation of many small credits without drift', () => {
			let balance = 0;
			// Credit 0.01 one hundred times - should equal exactly 1.00
			for (let i = 0; i < 100; i++) {
				balance = credit(balance, 0.01);
			}
			expect(balance).toBe(1.0);
		});

		it('should handle accumulation of many small debits without drift', () => {
			let balance = 1.0;
			// Debit 0.01 one hundred times - should equal exactly 0.00
			for (let i = 0; i < 100; i++) {
				balance = debit(balance, 0.01);
			}
			expect(balance).toBe(0.0);
		});

		it('should handle alternating credits and debits without drift', () => {
			let balance = 100.0;
			// Alternate between credit and debit of same amount
			for (let i = 0; i < 50; i++) {
				balance = credit(balance, 0.33);
				balance = debit(balance, 0.33);
			}
			expect(balance).toBe(100.0);
		});

		it('should handle values that cause IEEE 754 precision issues', () => {
			// These are known problematic values for floating point
			const problematicValues = [
				0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.01, 0.02, 0.03, 0.04,
				0.05, 0.06, 0.07, 0.08, 0.09,
			];

			for (const val of problematicValues) {
				const creditResult = credit(0, val);
				expect(creditResult).toBe(val);
				expect(creditResult.toString()).toMatch(/^\d+\.\d{1,2}$/);
			}
		});

		it('should handle subtraction of values that sum to problematic floats', () => {
			// 0.1 + 0.2 = 0.30000000000000004 in pure JS
			// But we should handle it correctly
			const balance = credit(0.1, 0.2);
			expect(balance).toBe(0.3);
			const result = debit(balance, 0.2);
			expect(result).toBe(0.1);
		});

		it('should handle values near JavaScript Number.MAX_SAFE_INTEGER / 100', () => {
			// Max safe integer is 2^53 - 1 = 9007199254740991
			// In cents: 90071992547409.91
			// But we're constrained to $1M max, so test with that
			// Use exactly 2 decimal places to avoid rounding issues
			const maxSafe = 9007199.25; // Well within our $1M limit
			const newBalance = credit(maxSafe, 0.01);
			expect(newBalance).toBe(9007199.26);
		});

		it('should handle rounding edge cases (0.005 rounds to 0.01)', () => {
			const newBalance = credit(0, 0.005);
			expect(newBalance).toBe(0.01);
		});

		it('should handle rounding edge cases (0.004 rounds to 0.00)', () => {
			const newBalance = credit(0, 0.004);
			expect(newBalance).toBe(0.0);
		});

		it('should handle values that when multiplied by 100 have precision issues', () => {
			// Some values when * 100 might have floating point issues
			const testCases = [
				{ balance: 0.1, amount: 0.2, expected: 0.3 },
				{ balance: 0.01, amount: 0.02, expected: 0.03 },
				{ balance: 0.001, amount: 0.002, expected: 0.0 }, // 0.001 rounds to 0, 0.002 rounds to 0
				{ balance: 0.005, amount: 0.005, expected: 0.02 }, // 0.005 rounds to 0.01, so 0.01 + 0.01 = 0.02
			];

			for (const testCase of testCases) {
				const result = credit(testCase.balance, testCase.amount);
				expect(result).toBe(testCase.expected);
			}
		});
	});

	describe('createWallet', () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should create a new wallet', () => {
			const wallet = createWallet('123');
			expect(wallet).toEqual({
				id: '123',
				balance: 0,
				version: 0,
				updated: new Date('2025-01-01T00:00:00.000Z'),
			});
		});
	});
});
