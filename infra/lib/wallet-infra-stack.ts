import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import type { Construct } from "constructs";
import { MigrationTask } from "./migration-task";
import { WalletDatabase } from "./wallet-database";
import { WalletEcsService } from "./wallet-ecs-service";

export interface WalletInfraStackProps extends cdk.StackProps {
	readonly imageTag?: string;
	readonly vpcId?: string;
}

export class WalletInfraStack extends cdk.Stack {
	public readonly vpc: ec2.IVpc;
	public readonly cluster: ecs.Cluster;
	public readonly containerRepository: ecr.IRepository;
	public readonly database: WalletDatabase;

	constructor(scope: Construct, id: string, props?: WalletInfraStackProps) {
		super(scope, id, props);

		const imageTag = props?.imageTag ?? this.node.tryGetContext("imageTag");
		const vpcId = props?.vpcId ?? "vpc-aa8468cc";

		// Network
		this.vpc = ec2.Vpc.fromLookup(this, "Vpc", {
			vpcId,
		});
		this.cluster = new ecs.Cluster(this, "Cluster", {
			vpc: this.vpc,
			clusterName: "wallet-service-cluster",
		});
		this.containerRepository = ecr.Repository.fromRepositoryName(
			this,
			"ContainerRepository",
			"wallet-service",
		);

		// Database
		this.database = new WalletDatabase(this, "Database", {
			vpc: this.vpc,
		});

		// Compute
		const walletService = new WalletEcsService(this, "WalletService", {
			port: 8000,
			imageTag,
			vpc: this.vpc,
			cluster: this.cluster,
			containerRepository: this.containerRepository,
			dbSecret: this.database.secret,
			database: this.database.database,
		});
		this.database.securityGroup.addIngressRule(
			walletService.securityGroup,
			ec2.Port.tcp(5432),
			"Allow access from Wallet Service",
		);

		const migrationTask = new MigrationTask(this, "MigrationTask", {
			database: this.database.database,
			containerRepository: this.containerRepository,
			imageTag,
			vpc: this.vpc,
			dbSecret: this.database.secret,
		});
		this.database.securityGroup.addIngressRule(
			migrationTask.securityGroup,
			ec2.Port.tcp(5432),
			"Allow access from Migration Task",
		);

		// Load Balancing
		const alb = this.createApplicationLoadBalancer(walletService);

		// Outputs
		new cdk.CfnOutput(this, "LoadBalancerDNS", {
			value: alb.loadBalancerDnsName,
		});
		new cdk.CfnOutput(this, "MigrationTaskDefArn", {
			value: migrationTask.taskDefinition.taskDefinitionArn,
		});
	}

	private createApplicationLoadBalancer(
		walletService: WalletEcsService,
	): elbv2.ApplicationLoadBalancer {
		const alb = new elbv2.ApplicationLoadBalancer(this, "LoadBalancer", {
			vpc: this.vpc,
			internetFacing: true,
			loadBalancerName: "wallet-service-alb",
			vpcSubnets: {
				subnets: this.vpc.publicSubnets,
			},
		});

		const listener = alb.addListener("Listener", {
			port: 80,
			open: true,
		});

		listener.addTargets("TargetGroup", {
			port: walletService.port,
			targets: [walletService.service],
			healthCheck: {
				path: "/v1/health",
				healthyHttpCodes: "200-399",
			},
		});

		return alb;
	}
}
