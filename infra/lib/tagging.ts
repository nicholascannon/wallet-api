import * as cdk from 'aws-cdk-lib';
import type { IConstruct } from 'constructs';

export interface TaggingProps {
	readonly environment: string;
	readonly project?: string;
	readonly owner?: string;
	readonly costCenter?: string;
}

export class TaggingAspect implements cdk.IAspect {
	private readonly props: TaggingProps;

	constructor(props: TaggingProps) {
		this.props = props;
	}

	visit(node: IConstruct): void {
		if (cdk.CfnResource.isCfnResource(node)) {
			cdk.Tags.of(node).add('Environment', this.props.environment);
			if (this.props.project) {
				cdk.Tags.of(node).add('Project', this.props.project);
			}
			if (this.props.owner) {
				cdk.Tags.of(node).add('Owner', this.props.owner);
			}
			if (this.props.costCenter) {
				cdk.Tags.of(node).add('CostCenter', this.props.costCenter);
			}
		}
	}
}
