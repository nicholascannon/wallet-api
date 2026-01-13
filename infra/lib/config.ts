import { z } from 'zod';

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
	readonly enableOpenApiDocs: boolean;
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
		enableOpenApiDocs: true,
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
		enableOpenApiDocs: true,
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
		enableOpenApiDocs: false,
	},
};

export function validateEnvironment(env: string): void {
	z.string()
		.superRefine((env, ctx) => {
			if (!['dev', 'staging', 'prod'].includes(env.toLowerCase())) {
				ctx.addIssue({
					code: 'custom',
					message: `Invalid environment: ${env}. Valid environments are: ${['dev', 'staging', 'prod'].join(', ')}`,
				});
			}
		})
		.parse(env);
}

export function validateImageTag(imageTag: string | undefined): string {
	return z
		.string({
			message:
				'imageTag is required. Provide it via stack props or CDK context: cdk deploy --context imageTag=<tag>',
		})
		.min(1, 'imageTag cannot be empty')
		.parse(imageTag);
}

export function validateVpcId(vpcId: string | undefined): string {
	return z
		.string()
		.regex(/^vpc-/, "VPC ID must be a valid VPC ID (starts with 'vpc-')")
		.parse(vpcId);
}

export function validateNumericRange(
	value: number,
	min: number,
	max: number,
	name: string,
): void {
	z.number()
		.min(min, { message: `${name} must be at least ${min}, got ${value}` })
		.max(max, { message: `${name} must be at most ${max}, got ${value}` })
		.parse(value);
}
