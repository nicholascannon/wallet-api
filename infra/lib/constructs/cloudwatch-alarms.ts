import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import type * as ecs from 'aws-cdk-lib/aws-ecs';
import type * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import type * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import type { EnvironmentConfig } from '../config';
import type { WalletEcsService } from './wallet-ecs-service';

export interface CloudWatchAlarmsProps {
	walletService: WalletEcsService;
	targetGroup: elbv2.ApplicationTargetGroup;
	database: rds.IDatabaseInstance;
	cluster: ecs.Cluster;
	envConfig: EnvironmentConfig;
}

export class CloudWatchAlarms extends Construct {
	constructor(scope: Construct, id: string, props: CloudWatchAlarmsProps) {
		super(scope, id);

		const { walletService, targetGroup, database, cluster, envConfig } = props;
		const service = walletService.service;

		// ECS CPU Utilization
		new cloudwatch.Alarm(this, 'EcsCpuUtilizationAlarm', {
			alarmName: `wallet-service-cpu-utilization-${envConfig.environment}`,
			metric: service.metricCpuUtilization(),
			threshold: 80,
			evaluationPeriods: 2,
			datapointsToAlarm: 2,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		// ECS Memory Utilization
		new cloudwatch.Alarm(this, 'EcsMemoryUtilizationAlarm', {
			alarmName: `wallet-service-memory-utilization-${envConfig.environment}`,
			metric: service.metricMemoryUtilization(),
			threshold: 80,
			evaluationPeriods: 2,
			datapointsToAlarm: 2,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		// ECS Running Task Count
		new cloudwatch.Alarm(this, 'EcsRunningTaskCountAlarm', {
			alarmName: `wallet-service-running-tasks-${envConfig.environment}`,
			metric: new cloudwatch.Metric({
				namespace: 'ECS/ContainerInsights',
				metricName: 'RunningTaskCount',
				dimensionsMap: {
					ClusterName: cluster.clusterName,
					ServiceName: service.serviceName,
				},
				statistic: 'Average',
			}),
			threshold: envConfig.minCapacity,
			comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
			evaluationPeriods: 1,
			datapointsToAlarm: 1,
			treatMissingData: cloudwatch.TreatMissingData.BREACHING,
		});

		// ECS Service Deployment Failures
		new cloudwatch.Alarm(this, 'EcsServiceDeploymentFailuresAlarm', {
			alarmName: `wallet-service-deployment-failures-${envConfig.environment}`,
			metric: new cloudwatch.Metric({
				namespace: 'ECS/ContainerInsights',
				metricName: 'ServiceDeploymentFailures',
				dimensionsMap: {
					ClusterName: cluster.clusterName,
					ServiceName: service.serviceName,
				},
				statistic: 'Sum',
			}),
			threshold: 1,
			evaluationPeriods: 1,
			datapointsToAlarm: 1,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		// RDS CPU Utilization
		new cloudwatch.Alarm(this, 'RdsCpuUtilizationAlarm', {
			alarmName: `wallet-db-cpu-utilization-${envConfig.environment}`,
			metric: database.metricCPUUtilization(),
			threshold: 80,
			evaluationPeriods: 2,
			datapointsToAlarm: 2,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		// RDS Database Connections
		new cloudwatch.Alarm(this, 'RdsDatabaseConnectionsAlarm', {
			alarmName: `wallet-db-connections-${envConfig.environment}`,
			metric: database.metricDatabaseConnections(),
			threshold: 80,
			evaluationPeriods: 2,
			datapointsToAlarm: 2,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		// RDS Storage Space
		new cloudwatch.Alarm(this, 'RdsStorageSpaceAlarm', {
			alarmName: `wallet-db-storage-space-${envConfig.environment}`,
			metric: database.metricFreeStorageSpace(),
			threshold: 2_000_000_000, // 2GB in bytes
			comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
			evaluationPeriods: 1,
			datapointsToAlarm: 1,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		// RDS Read Latency
		new cloudwatch.Alarm(this, 'RdsReadLatencyAlarm', {
			alarmName: `wallet-db-read-latency-${envConfig.environment}`,
			metric: database.metric('ReadLatency', {
				statistic: 'Average',
			}),
			threshold: 1, // 1 second
			evaluationPeriods: 2,
			datapointsToAlarm: 2,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		// RDS Write Latency
		new cloudwatch.Alarm(this, 'RdsWriteLatencyAlarm', {
			alarmName: `wallet-db-write-latency-${envConfig.environment}`,
			metric: database.metric('WriteLatency', {
				statistic: 'Average',
			}),
			threshold: 1, // 1 second
			evaluationPeriods: 2,
			datapointsToAlarm: 2,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		// ALB 5xx Errors
		new cloudwatch.Alarm(this, 'Alb5xxErrorsAlarm', {
			alarmName: `wallet-alb-5xx-errors-${envConfig.environment}`,
			metric: targetGroup.metric('HTTPCode_Target_5XX_Count', {
				statistic: 'Sum',
			}),
			threshold: 10,
			evaluationPeriods: 2,
			datapointsToAlarm: 2,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		// ALB Response Time
		new cloudwatch.Alarm(this, 'AlbResponseTimeAlarm', {
			alarmName: `wallet-alb-response-time-${envConfig.environment}`,
			metric: targetGroup.metrics.targetResponseTime(),
			threshold: 5, // 5 seconds
			evaluationPeriods: 2,
			datapointsToAlarm: 2,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		// ALB Unhealthy Hosts
		new cloudwatch.Alarm(this, 'AlbUnhealthyHostsAlarm', {
			alarmName: `wallet-alb-unhealthy-hosts-${envConfig.environment}`,
			metric: targetGroup.metrics.unhealthyHostCount(),
			threshold: 1,
			evaluationPeriods: 1,
			datapointsToAlarm: 1,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		// ALB Request Count (for monitoring)
		new cloudwatch.Alarm(this, 'AlbRequestCountAlarm', {
			alarmName: `wallet-alb-request-count-${envConfig.environment}`,
			metric: targetGroup.metrics.requestCount(),
			threshold: 1000,
			comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
			evaluationPeriods: 1,
			datapointsToAlarm: 1,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});
	}
}
