import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { LOGGER } from "../../lib/logger.js";

export class HealthCheckRepo {
	constructor(private db: NodePgDatabase) {}

	async checkHealth(): Promise<boolean> {
		try {
			await this.db.execute("SELECT 1");
			return true;
		} catch (error) {
			LOGGER.error("Health check failed", { error });
			return false;
		}
	}
}
