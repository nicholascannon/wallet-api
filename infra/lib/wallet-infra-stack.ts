import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import type { Construct } from 'constructs';
import { CloudWatchAlarms } from './cloudwatch-alarms';
import {
	ENVIRONMENTS,
	validateEnvironment,
	validateImageTag,
	validateVpcId,
} from './config';
import { MigrationTask } from './migration-task';
import { TaggingAspect } from './tagging';
import { WalletDatabase } from './wallet-database';
import { WalletEcsService } from './wallet-ecs-service';

export interface WalletInfraStackProps extends cdk.StackProps {
	readonly imageTag?: string;
	readonly vpcId?: string;
	readonly environment?: string;
	readonly project?: string;
	readonly owner?: string;
	readonly costCenter?: string;
}

export class WalletInfraStack extends cdk.Stack {
	public readonly vpc: ec2.IVpc;
	public readonly cluster: ecs.Cluster;
	public readonly containerRepository: ecr.IRepository;
	public readonly database: WalletDatabase;

	constructor(scope: Construct, id: string, props?: WalletInfraStackProps) {
		super(scope, id, props);

		// Environment configuration
		const envName =
			props?.environment ?? this.node.tryGetContext('environment') ?? 'dev';
		validateEnvironment(envName);
		const envConfig = ENVIRONMENTS[envName.toLowerCase()];

		// Validation
		const imageTag = validateImageTag(
			props?.imageTag ?? this.node.tryGetContext('imageTag'),
		);
		const vpcId = validateVpcId(
			props?.vpcId ?? envConfig.vpcId ?? this.node.tryGetContext('vpcId'),
		);

		// Apply resource tagging with lower priority to run after default Tag aspect (200)
		cdk.Aspects.of(this).add(
			new TaggingAspect({
				environment: envConfig.environment,
				project: props?.project ?? 'wallet-service',
				owner: props?.owner,
				costCenter: props?.costCenter,
			}),
			{
				priority: 100, // Lower priority than Tag aspect (200), so it runs first
			},
		);

		// Network
		this.vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
			vpcId,
		});

		// Create VPC endpoints for private subnet access
		this.createVpcEndpoints();

		this.cluster = new ecs.Cluster(this, 'Cluster', {
			vpc: this.vpc,
			clusterName: `wallet-service-cluster-${envConfig.environment}`,
		});
		this.containerRepository = ecr.Repository.fromRepositoryName(
			this,
			'ContainerRepository',
			'wallet-service',
		);

		// Database
		this.database = new WalletDatabase(this, 'Database', {
			vpc: this.vpc,
			envConfig,
		});

		// Compute
		const walletService = new WalletEcsService(this, 'WalletService', {
			port: 8000,
			imageTag,
			vpc: this.vpc,
			cluster: this.cluster,
			containerRepository: this.containerRepository,
			dbSecret: this.database.secret,
			database: this.database.database,
			envConfig,
		});
		this.database.securityGroup.addIngressRule(
			walletService.securityGroup,
			ec2.Port.tcp(5432),
			'Allow access from Wallet Service',
		);

		const migrationTask = new MigrationTask(this, 'MigrationTask', {
			database: this.database.database,
			containerRepository: this.containerRepository,
			imageTag,
			vpc: this.vpc,
			dbSecret: this.database.secret,
		});
		this.database.securityGroup.addIngressRule(
			migrationTask.securityGroup,
			ec2.Port.tcp(5432),
			'Allow access from Migration Task',
		);

		// Load Balancing
		const { alb, targetGroup } =
			this.createApplicationLoadBalancer(walletService);

		// Monitoring
		new CloudWatchAlarms(this, 'CloudWatchAlarms', {
			walletService,
			targetGroup,
			database: this.database.database,
			cluster: this.cluster,
			envConfig,
		});

		// Outputs
		new cdk.CfnOutput(this, 'LoadBalancerDNS', {
			value: alb.loadBalancerDnsName,
		});
		new cdk.CfnOutput(this, 'MigrationTaskDefArn', {
			value: migrationTask.taskDefinition.taskDefinitionArn,
		});
		new cdk.CfnOutput(this, 'Environment', {
			value: envConfig.environment,
		});
	}

	private createVpcEndpoints(): void {
		// VPC endpoints for private subnet access to AWS services
		const region = this.region || cdk.Aws.REGION;

		// ECR endpoint for pulling container images
		new ec2.InterfaceVpcEndpoint(this, 'EcrEndpoint', {
			vpc: this.vpc,
			service: new ec2.InterfaceVpcEndpointService(
				`com.amazonaws.${region}.ecr.dkr`,
			),
			privateDnsEnabled: true,
			subnets: {
				subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
			},
		});

		// ECR API endpoint
		new ec2.InterfaceVpcEndpoint(this, 'EcrApiEndpoint', {
			vpc: this.vpc,
			service: new ec2.InterfaceVpcEndpointService(
				`com.amazonaws.${region}.ecr.api`,
			),
			privateDnsEnabled: true,
			subnets: {
				subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
			},
		});

		// S3 endpoint for ECR image layers (Gateway endpoint, no cost)
		new ec2.GatewayVpcEndpoint(this, 'S3Endpoint', {
			vpc: this.vpc,
			service: ec2.GatewayVpcEndpointAwsService.S3,
		});

		// CloudWatch Logs endpoint
		new ec2.InterfaceVpcEndpoint(this, 'CloudWatchLogsEndpoint', {
			vpc: this.vpc,
			service: new ec2.InterfaceVpcEndpointService(
				`com.amazonaws.${region}.logs`,
			),
			privateDnsEnabled: true,
			subnets: {
				subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
			},
		});

		// Secrets Manager endpoint
		new ec2.InterfaceVpcEndpoint(this, 'SecretsManagerEndpoint', {
			vpc: this.vpc,
			service: new ec2.InterfaceVpcEndpointService(
				`com.amazonaws.${region}.secretsmanager`,
			),
			privateDnsEnabled: true,
			subnets: {
				subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
			},
		});
	}

	private createApplicationLoadBalancer(walletService: WalletEcsService): {
		alb: elbv2.ApplicationLoadBalancer;
		targetGroup: elbv2.ApplicationTargetGroup;
	} {
		const alb = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
			vpc: this.vpc,
			internetFacing: true,
			loadBalancerName: `wallet-service-alb-${this.node.tryGetContext('environment') ?? 'dev'}`,
			vpcSubnets: {
				subnets: this.vpc.publicSubnets,
			},
			idleTimeout: cdk.Duration.seconds(60),
			crossZoneEnabled: true,
		});

		// Allow ALB to access ECS service
		walletService.securityGroup.addIngressRule(
			ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
			ec2.Port.tcp(walletService.port),
			'Allow ALB to access ECS service',
		);

		const listener = alb.addListener('Listener', {
			port: 80,
			open: true,
		});

		const targetGroup = listener.addTargets('TargetGroup', {
			port: walletService.port,
			targets: [walletService.service],
			healthCheck: {
				path: '/v1/health',
				healthyHttpCodes: '200-399',
				interval: cdk.Duration.seconds(30),
				timeout: cdk.Duration.seconds(5),
				healthyThresholdCount: 2,
				unhealthyThresholdCount: 3,
			},
			deregistrationDelay: cdk.Duration.seconds(30),
			slowStart: cdk.Duration.seconds(30),
		});

		return { alb, targetGroup };
	}
}
