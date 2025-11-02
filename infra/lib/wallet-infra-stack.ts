import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";
import { WalletEcsService } from "./wallet-ecs-service";

const IMAGE_TAG = "2fca8b0";

export class WalletInfraStack extends cdk.Stack {
	public readonly vpc: ec2.IVpc;
	public readonly cluster: ecs.Cluster;
	public readonly containerRepository: ecr.IRepository;
	public readonly database: rds.DatabaseInstance;

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

		const dbSecret = new secretsmanager.Secret(this, "DbSecret", {
			generateSecretString: {
				secretStringTemplate: JSON.stringify({ username: "postgres" }),
				generateStringKey: "password",
				passwordLength: 20,
				excludeCharacters: " %+~`#$&*()|[]{}:;<>?!'/@\"\\",
			},
		});

		const dbSecurityGroup = new ec2.SecurityGroup(this, "DBSecurityGroup", {
			vpc: this.vpc,
			description: "Security group for Postgres database",
			allowAllOutbound: false,
		});

		this.database = new rds.DatabaseInstance(this, "WalletDatabase", {
			engine: rds.DatabaseInstanceEngine.postgres({
				version: rds.PostgresEngineVersion.VER_13,
			}),
			instanceType: ec2.InstanceType.of(
				ec2.InstanceClass.T3,
				ec2.InstanceSize.MICRO,
			),
			vpc: this.vpc,
			vpcSubnets: {
				subnets: this.vpc.publicSubnets, // no private subnets in this VPC for simplicity
			},
			securityGroups: [dbSecurityGroup],
			databaseName: "wallet",
			credentials: rds.Credentials.fromSecret(dbSecret),
			allocatedStorage: 20,
			maxAllocatedStorage: 20,
			storageType: rds.StorageType.GP3,
			multiAz: false,
			publiclyAccessible: false,
			deletionProtection: false, // because this is a learning project
			backupRetention: cdk.Duration.days(0), // disable backups
		});

		const walletService = new WalletEcsService(this, "WalletEcsService", {
			port: 8000,
			imageTag: IMAGE_TAG,
			vpc: this.vpc,
			cluster: this.cluster,
			containerRepository: this.containerRepository,
			dbSecret,
			database: this.database,
		});
		dbSecurityGroup.addIngressRule(
			walletService.securityGroup,
			ec2.Port.tcp(5432),
			"Allow access from Wallet Service",
		);

		const { migrationTaskDef, migrationTaskSG } =
			this.createMigrationTaskDef(dbSecret);
		dbSecurityGroup.addIngressRule(
			migrationTaskSG,
			ec2.Port.tcp(5432),
			"Allow access from Migration Task",
		);

		const alb = this.createALB(walletService);

		new cdk.CfnOutput(this, "LoadBalancerDNS", {
			value: alb.loadBalancerDnsName,
		});
		new cdk.CfnOutput(this, "MigrationTaskDefArn", {
			value: migrationTaskDef.taskDefinitionArn,
		});
	}

	private createMigrationTaskDef(dbSecret: secretsmanager.ISecret) {
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
			entryPoint: ["npm", "run", "db:migrate"],
			logging: ecs.LogDrivers.awsLogs({ streamPrefix: "WalletMigrations" }),
			environment: {
				DB_HOST: this.database.instanceEndpoint.hostname,
				DB_PORT: this.database.instanceEndpoint.port.toString(),
			},
			secrets: {
				DB_NAME: ecs.Secret.fromSecretsManager(dbSecret, "dbname"),
				DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, "username"),
				DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, "password"),
			},
		});

		const migrationTaskSG = new ec2.SecurityGroup(
			this,
			"MigrationTaskSecurityGroup",
			{
				vpc: this.vpc,
				description: "Allow Migration Task to access Database",
			},
		);

		return { migrationTaskDef, migrationTaskSG };
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
