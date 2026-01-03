import { describe, expect, it } from 'vitest';
import { money } from '../validation.js';

describe('money', () => {
	it('should accept valid two decimal place strings', () => {
		expect(() => money.parse('0.01')).not.toThrow();
		expect(() => money.parse('0.10')).not.toThrow();
		expect(() => money.parse('1.00')).not.toThrow();
		expect(() => money.parse('10.50')).not.toThrow();
		expect(() => money.parse('100.99')).not.toThrow();
		expect(() => money.parse('0.99')).not.toThrow();
		expect(money.parse('10.50')).toBe(10.5);
	});

	it('should accept whole numbers as strings', () => {
		expect(() => money.parse('0')).not.toThrow();
		expect(() => money.parse('1')).not.toThrow();
		expect(() => money.parse('100')).not.toThrow();
		expect(money.parse('100')).toBe(100);
	});

	it('should reject floating-point precision issues', () => {
		expect(() => money.parse('0.0100000000000000002')).toThrow();
		expect(() => money.parse('0.10000000000000001')).toThrow();
		expect(() => money.parse('1.0000000000000002')).toThrow();
	});

	it('should reject strings with more than two decimal places', () => {
		expect(() => money.parse('0.001')).toThrow();
		expect(() => money.parse('0.123')).toThrow();
		expect(() => money.parse('1.234')).toThrow();
		expect(() => money.parse('10.999')).toThrow();
	});

	it('should reject strings with one decimal place', () => {
		expect(() => money.parse('0.1')).toThrow();
		expect(() => money.parse('1.5')).toThrow();
		expect(() => money.parse('10.9')).toThrow();
	});

	it('should reject strings with no decimal digits', () => {
		expect(() => money.parse('10.')).toThrow();
	});

	it('should reject negative numbers with precision issues', () => {
		expect(() => money.parse('-0.0100000000000000002')).toThrow();
	});

	it('should not accept negative numbers with exactly two decimal places', () => {
		expect(() => money.parse('-0.01')).toThrow();
		expect(() => money.parse('-1.50')).toThrow();
	});

	it('should not accept negative whole numbers', () => {
		expect(() => money.parse('-1')).toThrow();
		expect(() => money.parse('-100')).toThrow();
	});

	it('should provide a clear error message', () => {
		try {
			money.parse('0.001');
			expect.fail('Should have thrown');
		} catch (error) {
			if (error instanceof Error && 'issues' in error) {
				const zodError = error as { issues: Array<{ message: string }> };
				const firstIssue = zodError.issues[0];
				if (firstIssue) {
					expect(firstIssue.message).toBe(
						'Only valid monetary values are allowed (e.g. "10.50", "0.01", "100.00", "50")',
					);
				}
			} else {
				throw error;
			}
		}
	});

	it('should reject non-numeric strings', () => {
		expect(() => money.parse('abc')).toThrow();
		expect(() => money.parse('10.50.50')).toThrow();
		expect(() => money.parse('10.50abc')).toThrow();
	});

	it('should transform string to number', () => {
		expect(money.parse('10.50')).toBe(10.5);
		expect(money.parse('0.01')).toBe(0.01);
		expect(money.parse('100')).toBe(100);
		expect(typeof money.parse('10.50')).toBe('number');
	});
});
