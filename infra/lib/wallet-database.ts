import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export interface WalletDatabaseProps {
	vpc: ec2.IVpc;
}

export class WalletDatabase extends Construct {
	public readonly database: rds.DatabaseInstance;
	public readonly secret: secretsmanager.Secret;
	public readonly securityGroup: ec2.SecurityGroup;

	constructor(scope: Construct, id: string, props: WalletDatabaseProps) {
		super(scope, id);

		this.secret = new secretsmanager.Secret(this, "Secret", {
			generateSecretString: {
				secretStringTemplate: JSON.stringify({ username: "postgres" }),
				generateStringKey: "password",
				passwordLength: 20,
				excludeCharacters: " %+~`#$&*()|[]{}:;<>?!'/@\"\\",
			},
		});

		this.securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
			vpc: props.vpc,
			description: "Security group for Postgres database",
			allowAllOutbound: false,
		});

		this.database = new rds.DatabaseInstance(this, "Database", {
			engine: rds.DatabaseInstanceEngine.postgres({
				version: rds.PostgresEngineVersion.VER_13,
			}),
			instanceType: ec2.InstanceType.of(
				ec2.InstanceClass.T3,
				ec2.InstanceSize.MICRO,
			),
			vpc: props.vpc,
			vpcSubnets: {
				subnets: props.vpc.publicSubnets, // no private subnets in this VPC for simplicity
			},
			securityGroups: [this.securityGroup],
			databaseName: "wallet",
			credentials: rds.Credentials.fromSecret(this.secret),
			allocatedStorage: 20,
			maxAllocatedStorage: 20,
			storageType: rds.StorageType.GP3,
			multiAz: false,
			publiclyAccessible: false,
			deletionProtection: false, // because this is a learning project
			backupRetention: cdk.Duration.days(0), // disable backups
		});
	}
}
