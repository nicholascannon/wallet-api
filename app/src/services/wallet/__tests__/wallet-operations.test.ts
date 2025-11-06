import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InsufficientFundsError, InvalidDebitAmountError } from '../errors.js';
import { createWallet, credit, debit } from '../wallet-operations.js';

describe('Wallet operations', () => {
	describe('credit', () => {
		it('should handle zero amount', () => {
			const newBalance = credit(
				{ id: '123', balance: 100, version: 1, updated: new Date() },
				0,
			);
			expect(newBalance).toBe(100);
		});

		it('should handle zero balance', () => {
			const newBalance = credit(
				{ id: '123', balance: 0, version: 1, updated: new Date() },
				50,
			);
			expect(newBalance).toBe(50);
		});

		it('should handle negative amount (should subtract)', () => {
			const newBalance = credit(
				{ id: '123', balance: 100, version: 1, updated: new Date() },
				-20,
			);
			expect(newBalance).toBe(80);
		});

		it('should handle floating point precision', () => {
			const newBalance = credit(
				{ id: '123', balance: 0.1, version: 1, updated: new Date() },
				0.2,
			);
			expect(newBalance).toBeCloseTo(0.3, 10);
		});

		it('should handle large numbers', () => {
			const newBalance = credit(
				{ id: '123', balance: 1e12, version: 1, updated: new Date() },
				1e12,
			);
			expect(newBalance).toBe(2e12);
		});
		it('should add amount to wallet balance', () => {
			const newBalance = credit(
				{ id: '123', balance: 100, version: 1, updated: new Date() },
				50,
			);
			expect(newBalance).toBe(150);
		});
	});

	describe('debit', () => {
		it('should handle zero amount', () => {
			const newBalance = debit(
				{ id: '123', balance: 100, version: 1, updated: new Date() },
				0,
			);
			expect(newBalance).toBe(100);
		});

		it('should handle zero balance and zero amount', () => {
			const newBalance = debit(
				{ id: '123', balance: 0, version: 1, updated: new Date() },
				0,
			);
			expect(newBalance).toBe(0);
		});

		it('should throw if amount is negative', () => {
			expect(() =>
				debit(
					{ id: '123', balance: 100, version: 1, updated: new Date() },
					-10,
				),
			).toThrow(InvalidDebitAmountError);
		});

		it('should handle floating point precision', () => {
			const newBalance = debit(
				{ id: '123', balance: 0.3, version: 1, updated: new Date() },
				0.2,
			);
			expect(newBalance).toBeCloseTo(0.1, 10);
		});

		it('should handle large numbers', () => {
			const newBalance = debit(
				{ id: '123', balance: 1e12, version: 1, updated: new Date() },
				1e11,
			);
			expect(newBalance).toBe(9e11);
		});
		it('should subtract amount from wallet balance', () => {
			const newBalance = debit(
				{ id: '123', balance: 100, version: 1, updated: new Date() },
				40,
			);
			expect(newBalance).toBe(60);
		});

		it('should throw if amount is greater than balance', () => {
			expect(() =>
				debit(
					{ id: '123', balance: 100, version: 1, updated: new Date() },
					200,
				),
			).toThrow(InsufficientFundsError);
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
