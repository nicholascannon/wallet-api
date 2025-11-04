import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import type * as rds from 'aws-cdk-lib/aws-rds';
import type * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import type { EnvironmentConfig } from './config';

interface WalletEcsServiceProps {
	readonly port: number;
	readonly imageTag: string;
	readonly vpc: ec2.IVpc;
	readonly cluster: ecs.Cluster;
	readonly containerRepository: ecr.IRepository;
	readonly dbSecret: secretsmanager.ISecret;
	readonly database: rds.IDatabaseInstance;
	readonly envConfig: EnvironmentConfig;
}

export class WalletEcsService extends Construct {
	public readonly service: ecs.FargateService;
	public readonly securityGroup: ec2.SecurityGroup;
	public readonly port: number;

	constructor(scope: Construct, id: string, props: WalletEcsServiceProps) {
		super(scope, id);
		const {
			port,
			imageTag,
			vpc,
			cluster,
			containerRepository,
			dbSecret,
			database,
		} = props;
		this.port = port;

		const taskDefinition = new ecs.FargateTaskDefinition(
			this,
			'TaskDefinition',
			{
				cpu: props.envConfig.cpu,
				memoryLimitMiB: props.envConfig.memoryLimitMiB,
				family: 'wallet-service',
			},
		);

		taskDefinition.addContainer('Container', {
			image: ecs.ContainerImage.fromEcrRepository(
				containerRepository,
				imageTag,
			),
			logging: ecs.LogDriver.awsLogs({ streamPrefix: 'wallet-service' }),
			portMappings: [
				{
					containerPort: port,
					hostPort: port,
					protocol: ecs.Protocol.TCP,
				},
			],
			environment: {
				PORT: port.toString(),
				DB_HOST: database.instanceEndpoint.hostname,
				DB_PORT: database.instanceEndpoint.port.toString(),
			},
			secrets: {
				DB_NAME: ecs.Secret.fromSecretsManager(dbSecret, 'dbname'),
				DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
				DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
			},
		});

		this.securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
			vpc,
			description: 'Allow ALB to access Wallet Service',
			allowAllOutbound: true, // Allow outbound for VPC endpoints and database access
		});

		this.service = new ecs.FargateService(this, 'Service', {
			serviceName: 'wallet-service',
			cluster,
			taskDefinition,
			desiredCount: props.envConfig.desiredCount,
			assignPublicIp: false, // Deployed in private subnet
			vpcSubnets: {
				subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
			},
			securityGroups: [this.securityGroup],
			circuitBreaker: {
				enable: true,
				rollback: true,
			},
			healthCheckGracePeriod: cdk.Duration.seconds(60),
			capacityProviderStrategies: [
				{
					capacityProvider: 'FARGATE',
					weight: 1,
				},
				{
					capacityProvider: 'FARGATE_SPOT',
					weight: 0,
				},
			],
		});

		// Auto Scaling
		const scalableTarget = this.service.autoScaleTaskCount({
			minCapacity: props.envConfig.minCapacity,
			maxCapacity: props.envConfig.maxCapacity,
		});

		// Scale based on CPU utilization
		scalableTarget.scaleOnCpuUtilization('CpuScaling', {
			targetUtilizationPercent: 70,
			scaleInCooldown: cdk.Duration.seconds(60),
			scaleOutCooldown: cdk.Duration.seconds(60),
		});

		// Scale based on memory utilization
		scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
			targetUtilizationPercent: 80,
			scaleInCooldown: cdk.Duration.seconds(60),
			scaleOutCooldown: cdk.Duration.seconds(60),
		});
	}
}
