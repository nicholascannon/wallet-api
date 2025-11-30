import { type Request, type Response, Router } from 'express';
import type { Controller } from '../../lib/controller.js';
import type { HealthRepository } from './health-repository.js';

export class HealthController implements Controller {
	public readonly router: Router;

	constructor(private readonly healthCheckRepo: HealthRepository) {
		this.router = Router();
		this.router.get('/', this.health);
	}

	private health = async (_req: Request, res: Response) => {
		const isHealthy = await this.healthCheckRepo.checkHealth();
		return res.json({ service: 'up', db: isHealthy ? 'ok' : 'error' });
	};
}
