# Wallet Service Infrastructure

CDK infrastructure for the Wallet Service API, deployed on AWS ECS Fargate with RDS PostgreSQL.

## Architecture Overview

The infrastructure consists of:

- **ECS Fargate Service**: Containerized wallet service running in private subnets
- **Application Load Balancer**: Internet-facing ALB for routing traffic to ECS tasks
- **RDS PostgreSQL**: Database instance in private subnets
- **VPC Endpoints**: Private connectivity to ECR, CloudWatch Logs, Secrets Manager, and S3
- **CloudWatch Alarms**: Comprehensive monitoring for ECS, RDS, and ALB metrics
- **Auto Scaling**: Automatic scaling based on CPU and memory utilization
- **Circuit Breaker**: Automatic rollback on deployment failures

### Network Architecture

- **Public Subnets**: ALB only
- **Private Subnets**: ECS tasks, RDS database, VPC endpoints
- **Security**: All resources use security groups with least-privilege access

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm
- CDK CLI installed: `npm install -g aws-cdk`
- Docker image pushed to ECR repository named `wallet-service`

## Environment Configuration

The stack supports three environments: `dev`, `staging`, and `prod`. Each environment has different resource configurations defined in `lib/config.ts`.

### Default Environment Values

- **dev**: 1 task, t3.micro DB, 20GB storage
- **staging**: 2 tasks, t3.small DB, 50-100GB storage
- **prod**: 2 tasks (scales to 10), t3.small DB, 100-500GB storage

## Deployment

### Required Parameters

1. **imageTag**: Docker image tag to deploy (required)
2. **environment**: Environment name (dev/staging/prod, defaults to dev)
3. **vpcId**: VPC ID where resources will be deployed (required, can be set per environment in config)

### Deployment Methods

#### Method 1: Using CDK Context

```bash
# Deploy to dev environment
cdk deploy --context environment=dev --context imageTag=latest

# Deploy to staging
cdk deploy --context environment=staging --context imageTag=v1.2.3

# Deploy to production
cdk deploy --context environment=prod --context imageTag=v1.2.3
```

#### Method 2: Using Stack Props (via code)

Update `bin/infra.ts`:

```typescript
new WalletInfraStack(app, "WalletInfraStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environment: "prod",
  imageTag: "v1.2.3",
  vpcId: "vpc-xxxxxxxxx",
  project: "wallet-service",
  owner: "your-team",
  costCenter: "engineering",
});
```

Then deploy:

```bash
cdk deploy
```

#### Method 3: Environment Variables

```bash
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1
cdk deploy --context environment=prod --context imageTag=v1.2.3
```

### Customizing Environment Configuration

Edit `lib/config.ts` to modify environment-specific settings:

```typescript
export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  dev: {
    environment: "dev",
    vpcId: "vpc-aa8468cc",
    desiredCount: 1,
    minCapacity: 1,
    maxCapacity: 2,
    // ... other settings
  },
  // ...
};
```

## Configuration Validation

The stack validates:

- **Environment name**: Must be one of: dev, staging, prod
- **Image tag**: Required and must be non-empty
- **VPC ID**: Required and must start with "vpc-"
- **Numeric parameters**: Min/max values for capacity and storage

## Resource Tagging

All resources are automatically tagged with:

- **Environment**: Environment name (dev/staging/prod)
- **Project**: Project name (default: "wallet-service")
- **Owner**: Optional owner tag
- **CostCenter**: Optional cost center tag

Tags can be set via stack props:

```typescript
new WalletInfraStack(app, "WalletInfraStack", {
  environment: "prod",
  project: "wallet-service",
  owner: "platform-team",
  costCenter: "engineering",
});
```

## Monitoring

### CloudWatch Alarms

The stack creates alarms for:

**ECS Service:**
- CPU utilization > 80%
- Memory utilization > 80%
- Running task count < minimum capacity
- Deployment failures

**RDS Database:**
- CPU utilization > 80%
- Database connections > 80
- Free storage space < 2GB
- Read latency > 1 second
- Write latency > 1 second

**Application Load Balancer:**
- 5xx errors > 10
- Response time > 5 seconds
- Unhealthy host count > 0
- Request count > 1000 (informational)

### Logging

- ECS service logs: CloudWatch Logs group `/aws/ecs/wallet-service`
- Migration task logs: CloudWatch Logs group `/aws/ecs/WalletMigrations`

## Auto Scaling

ECS service auto-scales based on:

- **CPU utilization**: Scales when > 70%
- **Memory utilization**: Scales when > 80%

Scaling limits are set per environment:
- **dev**: 1-2 tasks
- **staging**: 2-4 tasks
- **prod**: 2-10 tasks

## Security

### Network Security

- ECS tasks in private subnets (no public IPs)
- RDS in private subnets
- Security groups restrict access:
  - ALB → ECS: Only from VPC CIDR
  - ECS → RDS: Only on port 5432
  - Migration task → RDS: Only on port 5432

### Secrets Management

- Database credentials stored in AWS Secrets Manager
- Automatic password generation
- Secrets injected into containers via environment variables

### VPC Endpoints

Private connectivity to AWS services:
- ECR (for pulling container images)
- CloudWatch Logs (for log streaming)
- Secrets Manager (for secret retrieval)
- S3 (for ECR image layers, gateway endpoint)

## Cost Considerations

Approximate monthly costs (2 ECS tasks, us-east-1):

- ECS Fargate: ~$18
- RDS (t3.micro): ~$18
- Application Load Balancer: ~$23
- VPC Endpoints: ~$22
- CloudWatch Logs: ~$1-2
- **Total**: ~$82-85/month

Note: Costs vary by region and usage. VPC endpoints can be replaced with NAT Gateway if preferred.

## Useful Commands

```bash
# Compile TypeScript
npm run build

# Watch for changes
npm run watch

# Run tests
npm run test

# Synthesize CloudFormation template
npx cdk synth

# Compare deployed stack
npx cdk diff

# Deploy stack
npx cdk deploy

# Deploy with specific environment
npx cdk deploy --context environment=prod --context imageTag=v1.2.3

# Destroy stack (use with caution)
npx cdk destroy

# List all stacks
npx cdk list
```

## Troubleshooting

### Deployment Failures

1. **Image tag not found**: Ensure the Docker image exists in ECR with the specified tag
2. **VPC not found**: Verify the VPC ID exists in the target region
3. **Subnet issues**: Ensure the VPC has private subnets with egress (NAT Gateway or VPC endpoints)

### Service Not Starting

1. Check ECS service events in AWS Console
2. Review CloudWatch Logs for container errors
3. Verify security groups allow ALB → ECS communication
4. Check that database credentials are correctly configured in Secrets Manager

### Scaling Issues

1. Verify auto-scaling limits in `lib/config.ts`
2. Check CloudWatch metrics for CPU/memory utilization
3. Review auto-scaling policies in AWS Console

## Migration Tasks

Database migrations are run via a separate ECS task definition. To run migrations manually:

```bash
aws ecs run-task \
  --cluster wallet-service-cluster-<environment> \
  --task-definition wallet-service-migration \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"
```

## Further Reading

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [ECS Fargate Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
