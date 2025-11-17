let running = true;
const listeners: Array<() => Promise<unknown> | unknown> = [];

/**
 * Process lifecycle manager. Allows you to register callbacks that get run
 * before the process exists. Callbacks are run on `uncaughtException`, `unhandledRejection`,
 * `SIGTERM` and `SIGINT`.
 */
export const lifecycle = {
	isRunning: () => running,
	on: (_: 'close', listener: () => Promise<unknown> | unknown) => {
		listeners.push(listener);
	},
	shutdown: async () => {
		if (running) {
			running = false;
			await Promise.all(listeners.map((listener) => listener()));
		}
	},
};

export type Lifecycle = typeof lifecycle;

process
	.on('uncaughtException', async () => {
		process.exitCode = 1;
		await lifecycle.shutdown();
	})
	.on('unhandledRejection', async () => {
		process.exitCode = 1;
		await lifecycle.shutdown();
	})
	.on('SIGTERM', async () => {
		await lifecycle.shutdown();
	})
	.on('SIGINT', async () => {
		await lifecycle.shutdown();
	});
