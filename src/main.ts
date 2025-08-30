import express from 'express';
import { LOGGER } from '@/lib/logger.js';

const app = express();

app.get('/', (_, res) => res.send('Wallet API'));

app.listen(3000, () =>
  LOGGER.info('Server is running on http://localhost:3000')
);
