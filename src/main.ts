import { setupProcessLogging, LOGGER } from './lib/logger.js';
import { createApp } from './app.js';
import { lifecycle } from './lib/lifecycle.js';

setupProcessLogging();

const app = createApp().listen(3000, () => {
  LOGGER.info('Server is running on http://localhost:3000');
  lifecycle.on('close', () => app.close(() => LOGGER.info('Server closed')));
});
