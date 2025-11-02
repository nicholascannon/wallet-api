import * as ec2 from "aws-cdk-lib/aws-ec2";
import type * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";

export class WalletEcsService extends Construct {
	public readonly service: ecs.FargateService;
	public readonly securityGroup: ec2.SecurityGroup;

	constructor(
		scope: Construct,
		id: string,
		options: {
			port: number;
			imageTag: string;
			vpc: ec2.IVpc;
			cluster: ecs.Cluster;
			containerRepository: ecr.IRepository;
		},
	) {
		super(scope, id);
		const { port, imageTag, vpc, cluster, containerRepository } = options;

		const taskDefinition = new ecs.FargateTaskDefinition(
			this,
			"WalletServiceTaskDefinition",
			{
				cpu: 256,
				memoryLimitMiB: 512,
				family: "wallet-service",
			},
		);

		taskDefinition.addContainer("WalletServiceContainer", {
			image: ecs.ContainerImage.fromEcrRepository(
				containerRepository,
				imageTag,
			),
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

		this.securityGroup = new ec2.SecurityGroup(
			this,
			"WalletServiceSecurityGroup",
			{
				vpc,
				description: "Allow ALB to access Wallet Service",
			},
		);

		this.service = new ecs.FargateService(this, "WalletFargateService", {
			serviceName: "wallet-service",
			cluster,
			taskDefinition,
			desiredCount: 2,
			// NOTE: this should be deployed in a private subnet
			assignPublicIp: true,
			vpcSubnets: {
				subnets: vpc.publicSubnets,
			},
			securityGroups: [this.securityGroup],
		});
	}
}
