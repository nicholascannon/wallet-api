export interface EnvironmentConfig {
	readonly environment: string;
	readonly vpcId: string;
	readonly desiredCount: number;
	readonly minCapacity: number;
	readonly maxCapacity: number;
	readonly cpu: number;
	readonly memoryLimitMiB: number;
	readonly rdsInstanceType: {
		class: string;
		size: string;
	};
	readonly rdsAllocatedStorage: number;
	readonly rdsMaxAllocatedStorage: number;
}

export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
	dev: {
		environment: 'dev',
		vpcId: 'vpc-aa8468cc', // default fallback
		desiredCount: 1,
		minCapacity: 1,
		maxCapacity: 2,
		cpu: 256,
		memoryLimitMiB: 512,
		rdsInstanceType: {
			class: 'T3',
			size: 'MICRO',
		},
		rdsAllocatedStorage: 20,
		rdsMaxAllocatedStorage: 20,
	},
	staging: {
		environment: 'staging',
		vpcId: 'vpc-aa8468cc', // update with actual staging VPC ID
		desiredCount: 2,
		minCapacity: 2,
		maxCapacity: 4,
		cpu: 512,
		memoryLimitMiB: 1024,
		rdsInstanceType: {
			class: 'T3',
			size: 'SMALL',
		},
		rdsAllocatedStorage: 50,
		rdsMaxAllocatedStorage: 100,
	},
	prod: {
		environment: 'prod',
		vpcId: 'vpc-aa8468cc', // update with actual prod VPC ID
		desiredCount: 2,
		minCapacity: 2,
		maxCapacity: 10,
		cpu: 512,
		memoryLimitMiB: 1024,
		rdsInstanceType: {
			class: 'T3',
			size: 'SMALL',
		},
		rdsAllocatedStorage: 100,
		rdsMaxAllocatedStorage: 500,
	},
};

export function validateEnvironment(env: string): void {
	if (!env || typeof env !== 'string') {
		throw new Error('Environment name is required and must be a string');
	}
	const validEnvironments = Object.keys(ENVIRONMENTS);
	if (!validEnvironments.includes(env.toLowerCase())) {
		throw new Error(
			`Invalid environment: ${env}. Valid environments are: ${validEnvironments.join(', ')}`,
		);
	}
}

export function validateImageTag(imageTag: string | undefined): string {
	if (
		!imageTag ||
		typeof imageTag !== 'string' ||
		imageTag.trim().length === 0
	) {
		throw new Error(
			'imageTag is required. Provide it via stack props or CDK context: cdk deploy --context imageTag=<tag>',
		);
	}
	return imageTag;
}

export function validateVpcId(vpcId: string | undefined): string {
	if (!vpcId || typeof vpcId !== 'string' || !vpcId.startsWith('vpc-')) {
		throw new Error(
			"VPC ID is required and must be a valid VPC ID (starts with 'vpc-')",
		);
	}
	return vpcId;
}

export function validateNumericRange(
	value: number,
	min: number,
	max: number,
	name: string,
): void {
	if (value < min || value > max) {
		throw new Error(`${name} must be between ${min} and ${max}, got ${value}`);
	}
}
