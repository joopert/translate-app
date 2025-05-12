import { Stack, StackProps } from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";
import { config, Environment } from "../../config";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as ecr from "aws-cdk-lib/aws-ecr";

export interface BackendEcsServiceStackProps extends StackProps {
  cluster: ecs.Cluster;
  cloudmap: servicediscovery.INamespace;
  githubActionsRole?: iam.Role;
  applicationSecrets: ssm.StringParameter;
  backendEcrRepo: ecr.IRepository;
}

export class BackendEcsServiceStack extends Stack {
  public readonly backendService: ecs.Ec2Service;
  public readonly taskRoleBackend: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    props: BackendEcsServiceStackProps
  ) {
    super(scope, id, props);
    const backendLogGroup = new logs.LogGroup(this, "BackendLogGroup", {
      logGroupName: "backend",
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.taskRoleBackend = new iam.Role(this, "ecsTaskRoleBackend", {
      roleName: "ecsTaskRoleBackend",
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      inlinePolicies: {
        ssmAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "ssm:DescribeParameters",
                "ssm:GetParameters",
                "ssm:GetParameter",
              ],
              effect: iam.Effect.ALLOW,
              resources: [props.applicationSecrets.parameterArn],
            }),
          ],
        }),
      },
    });

    const taskExecutionRole = new iam.Role(this, "BackendTaskExecutionRole", {
      roleName: "backendTaskExecutionRole", // this role name is used in the shared account cdk code
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSCloudMapRegisterInstanceAccess"
        ),
      ],
      inlinePolicies: {
        cloudwatchAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["logs:*"],
              resources: [`${backendLogGroup.logGroupArn}:*`],
            }),
          ],
        }),
        ecrAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
              ],
              resources: [props.backendEcrRepo.repositoryArn],
            }),
          ],
        }),
      },
    });

    const backendTaskDefinition = new ecs.Ec2TaskDefinition(
      this,
      "BackendTaskDef",
      {
        taskRole: this.taskRoleBackend,
        executionRole: taskExecutionRole,
        networkMode: ecs.NetworkMode.BRIDGE,
        family: "backend-task",
      }
    );

    backendTaskDefinition.addContainer("backend", {
      containerName: "backend",
      stopTimeout:
        config.environment === Environment.dev
          ? cdk.Duration.seconds(2)
          : undefined,
      image: ecs.ContainerImage.fromEcrRepository(
        props.backendEcrRepo,
        "latest"
      ),
      environment: {
        APP_ENV: "backend",
        CORS_ORIGINS: `["https://${config.domain}"]`,
        ENVIRONMENT: config.environment,
      },
      logging: ecs.LogDriver.awsLogs({
        logGroup: backendLogGroup,
        streamPrefix: "backend",
      }),
      memoryReservationMiB: 128,
      portMappings: [{ containerPort: 8000, name: "backend" }],
    });

    this.backendService = new ecs.Ec2Service(this, "backendEcsService", {
      cluster: props.cluster,
      taskDefinition: backendTaskDefinition,
      enableExecuteCommand: true,
      serviceName: "backend",
      availabilityZoneRebalancing: ecs.AvailabilityZoneRebalancing.ENABLED,
      circuitBreaker: {
        enable: true,
      },
      serviceConnectConfiguration: {
        namespace: props.cloudmap.namespaceName,
        services: [
          {
            dnsName: "backend",
            port: 8000,
            portMappingName: "backend",
            discoveryName: "backend",
          },
        ],
      },
    });

    if (props.githubActionsRole) {
      props.githubActionsRole.addToPolicy(
        new iam.PolicyStatement({
          sid: "EcsUpdateServiceBackend",
          actions: ["ecs:UpdateService"],
          effect: iam.Effect.ALLOW,
          resources: [this.backendService.serviceArn],
        })
      );
    }
  }
}
