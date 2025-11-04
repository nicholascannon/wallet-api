import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import type * as rds from 'aws-cdk-lib/aws-rds';
import type * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface MigrationTaskProps {
	database: rds.IDatabaseInstance;
	containerRepository: ecr.IRepository;
	imageTag: string;
	vpc: ec2.IVpc;
	dbSecret: secretsmanager.ISecret;
}

export class MigrationTask extends Construct {
	public readonly taskDefinition: ecs.FargateTaskDefinition;
	public readonly securityGroup: ec2.SecurityGroup;

	constructor(scope: Construct, id: string, props: MigrationTaskProps) {
		super(scope, id);

		this.taskDefinition = new ecs.FargateTaskDefinition(
			this,
			'TaskDefinition',
			{
				cpu: 256,
				memoryLimitMiB: 512,
				family: 'wallet-service-migration',
			},
		);

		this.taskDefinition.addContainer('Container', {
			image: ecs.ContainerImage.fromEcrRepository(
				props.containerRepository,
				props.imageTag,
			),
			entryPoint: ['npm', 'run', 'db:migrate'],
			logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'WalletMigrations' }),
			environment: {
				DB_HOST: props.database.instanceEndpoint.hostname,
				DB_PORT: props.database.instanceEndpoint.port.toString(),
			},
			secrets: {
				DB_NAME: ecs.Secret.fromSecretsManager(props.dbSecret, 'dbname'),
				DB_USERNAME: ecs.Secret.fromSecretsManager(props.dbSecret, 'username'),
				DB_PASSWORD: ecs.Secret.fromSecretsManager(props.dbSecret, 'password'),
			},
		});

		this.securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
			vpc: props.vpc,
			description: 'Allow Migration Task to access Database',
			allowAllOutbound: true, // Allow outbound for VPC endpoints and database access
		});
	}
}
