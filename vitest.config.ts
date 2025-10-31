import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.test.ts'],
		setupFiles: './src/config/testing',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'dist/',
				'coverage/',
				'**/*.test.ts',
				'**/*.test.js',
				'**/__tests__/**',
				'**/test/**',
				'drizzle/',
				'postman/',
				'*.config.ts',
				'*.config.js',
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
		},
	},
});
