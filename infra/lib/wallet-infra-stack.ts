import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import type { Construct } from "constructs";
import { WalletEcsService } from "./wallet-ecs-service";

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
		const containerRepository = ecr.Repository.fromRepositoryName(
			this,
			"WalletServiceRepo",
			"wallet-service",
		);

		const walletService = new WalletEcsService(this, "WalletEcsService", {
			port: 8000,
			imageTag: "0fe2552",
			vpc,
			cluster,
			containerRepository,
		});

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
			port: 8000,
			targets: [walletService.service],
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
