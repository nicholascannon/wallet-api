import { describe, expect, it } from 'vitest';
import type { Wallet } from '../wallet.js';
import { credit, debit } from '../wallet.js';

describe('Wallet domain functions', () => {
	const baseWallet: Wallet = { id: 'w1', balance: 100 };

	describe('credit', () => {
		it('should add amount to wallet balance', () => {
			const updated = credit(baseWallet, 50);
			expect(updated.balance).toBe(150);
		});
	});

	describe('debit', () => {
		it('should subtract amount from wallet balance', () => {
			const updated = debit(baseWallet, 40);
			expect(updated.balance).toBe(60);
		});

		it('should throw if amount is greater than balance', () => {
			expect(() => debit(baseWallet, 200)).toThrow('Insufficient funds');
		});
	});
});
