import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import type { Construct } from "constructs";
import { WalletEcsService } from "./wallet-ecs-service";

const IMAGE_TAG = "0fe2552";

export class WalletInfraStack extends cdk.Stack {
	public readonly vpc: ec2.IVpc;
	public readonly cluster: ecs.Cluster;
	public readonly containerRepository: ecr.IRepository;

	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		this.vpc = ec2.Vpc.fromLookup(this, "Vpc", {
			vpcId: "vpc-aa8468cc",
		});
		this.cluster = new ecs.Cluster(this, "Cluster", {
			vpc: this.vpc,
			clusterName: "wallet-service-cluster",
		});
		this.containerRepository = ecr.Repository.fromRepositoryName(
			this,
			"WalletServiceRepo",
			"wallet-service",
		);

		const walletService = new WalletEcsService(this, "WalletEcsService", {
			port: 8000,
			imageTag: IMAGE_TAG,
			vpc: this.vpc,
			cluster: this.cluster,
			containerRepository: this.containerRepository,
		});

		const migrationTaskDef = this.createMigrationTaskDef();

		const alb = this.createALB(walletService);

		new cdk.CfnOutput(this, "LoadBalancerDNS", {
			value: alb.loadBalancerDnsName,
		});
		new cdk.CfnOutput(this, "MigrationTaskDefArn", {
			value: migrationTaskDef.taskDefinitionArn,
		});
	}

	private createMigrationTaskDef() {
		const migrationTaskDef = new ecs.FargateTaskDefinition(
			this,
			"MigrationTaskDefinition",
			{
				cpu: 256,
				memoryLimitMiB: 512,
				family: "wallet-service-migration",
			},
		);
		migrationTaskDef.addContainer("MigrationContainer", {
			image: ecs.ContainerImage.fromEcrRepository(
				this.containerRepository,
				IMAGE_TAG,
			),
			command: ["npm", "run", "db:migrate"],
			logging: ecs.LogDrivers.awsLogs({ streamPrefix: "WalletMigrations" }),
			environment: {
				DATABASE_URL: "postgres://postgres:postgres@db:5432/wallet", // TODO: database URL
			},
		});

		return migrationTaskDef;
	}

	private createALB(walletService: WalletEcsService) {
		const alb = new elbv2.ApplicationLoadBalancer(this, "WalletServiceALB", {
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
		listener.addTargets("WalletServiceTG", {
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
