import { beforeEach, vi } from 'vitest';

beforeEach(() => {
	vi.mock('../lib/logger.js'); // silence logger during tests
});

vi.mock('../config/env.js', () => ({
	CONFIG: {
		env: 'test',
		cors: {
			hosts: [],
		},
	},
}));
