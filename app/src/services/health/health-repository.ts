export interface HealthRepository {
	checkHealth(): Promise<boolean>;
}
