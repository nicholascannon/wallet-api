import { beforeEach, vi } from 'vitest';

beforeEach(() => {
	vi.mock('../lib/logger.js'); // silence logger during tests
});
