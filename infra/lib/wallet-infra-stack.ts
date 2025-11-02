import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import type { Construct } from "constructs";

export class WalletInfraStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const vpc = ec2.Vpc.fromLookup(this, "Vpc", {
			vpcId: "vpc-aa8468cc",
		});

		const cluster = new ecs.Cluster(this, "Cluster", {
			vpc,
			clusterName: "wallet-service-cluster",
		});

		const taskDefinition = new ecs.FargateTaskDefinition(
			this,
			"WalletServiceTaskDefinition",
			{
				cpu: 256,
				memoryLimitMiB: 512,
				family: "wallet-service",
			},
		);

		const port = 8000;
		const repo = ecr.Repository.fromRepositoryName(
			this,
			"WalletServiceRepo",
			"wallet-service",
		);

		taskDefinition.addContainer("WalletServiceContainer", {
			image: ecs.ContainerImage.fromEcrRepository(repo, "0fe2552"),
			logging: ecs.LogDriver.awsLogs({ streamPrefix: "wallet-service" }),
			portMappings: [
				{
					containerPort: port,
					hostPort: port,
					protocol: ecs.Protocol.TCP,
				},
			],
			environment: {
				PORT: port.toString(),
				DATABASE_URL: "postgres://postgres:postgres@db:5432/wallet", // TODO: database URL
			},
		});

		const walletServiceSecurityGroup = new ec2.SecurityGroup(
			this,
			"WalletServiceSecurityGroup",
			{
				vpc,
				description: "Allow ALB to access Wallet Service",
			},
		);

		const walletFargateService = new ecs.FargateService(
			this,
			"WalletFargateService",
			{
				serviceName: "wallet-service",
				cluster,
				taskDefinition,
				desiredCount: 2,
				// NOTE: this should be private for production
				assignPublicIp: true,
				vpcSubnets: {
					subnets: vpc.publicSubnets,
				},
				securityGroups: [walletServiceSecurityGroup],
			},
		);

		const alb = new elbv2.ApplicationLoadBalancer(this, "WalletServiceALB", {
			vpc,
			internetFacing: true,
			loadBalancerName: "wallet-service-alb",
			vpcSubnets: {
				subnets: vpc.publicSubnets,
			},
		});
		const listener = alb.addListener("Listener", {
			port: 80,
			open: true,
		});
		listener.addTargets("WalletServiceTG", {
			port,
			targets: [walletFargateService],
			healthCheck: {
				path: "/v1/health",
				healthyHttpCodes: "200-399",
			},
		});

		new cdk.CfnOutput(this, "LoadBalancerDNS", {
			value: alb.loadBalancerDnsName,
		});
	}
}
