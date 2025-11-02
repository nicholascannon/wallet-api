import * as ec2 from "aws-cdk-lib/aws-ec2";
import type * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import type * as rds from "aws-cdk-lib/aws-rds";
import type * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

interface WalletEcsServiceProps {
	readonly port: number;
	readonly imageTag: string;
	readonly vpc: ec2.IVpc;
	readonly cluster: ecs.Cluster;
	readonly containerRepository: ecr.IRepository;
	readonly dbSecret: secretsmanager.ISecret;
	readonly database: rds.IDatabaseInstance;
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
			"TaskDefinition",
			{
				cpu: 256,
				memoryLimitMiB: 512,
				family: "wallet-service",
			},
		);

		taskDefinition.addContainer("Container", {
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
				DB_HOST: database.instanceEndpoint.hostname,
				DB_PORT: database.instanceEndpoint.port.toString(),
			},
			secrets: {
				DB_NAME: ecs.Secret.fromSecretsManager(dbSecret, "dbname"),
				DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, "username"),
				DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, "password"),
			},
		});

		this.securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
			vpc,
			description: "Allow ALB to access Wallet Service",
		});

		this.service = new ecs.FargateService(this, "Service", {
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
