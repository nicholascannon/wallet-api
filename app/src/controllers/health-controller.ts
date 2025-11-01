import { type Request, type Response, Router } from "express";
import type { HealthCheckRepo } from "../data/repositories/health-check-repo.js";

export class HealthController {
	public readonly router: Router;

	constructor(private readonly healthCheckRepo: HealthCheckRepo) {
		this.router = Router();
		this.router.get("/", this.health);
	}

	private health = async (_req: Request, res: Response) => {
		const isHealthy = await this.healthCheckRepo.checkHealth();
		return res
			.status(isHealthy ? 200 : 500)
			.json({ message: isHealthy ? "ok" : "error" });
	};
}
