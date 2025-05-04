import { Stack, StackProps } from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";

export interface BackendEcsServiceStackProps extends StackProps {
  cluster: ecs.Cluster;
  cloudmap: servicediscovery.INamespace;
  githubActionsRole?: iam.Role;
}

export class BackendEcsServiceStack extends Stack {
  public readonly backendService: ecs.Ec2Service;

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

    const taskRole = new iam.Role(this, "ecsTaskRoleBackend", {
      roleName: "ecsTaskRoleBackend",
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      inlinePolicies: {
        // ssmAccess: new iam.PolicyDocument({
        //   statements: [
        //     new iam.PolicyStatement({
        //       actions: [
        //         "ssm:DescribeParameters",
        //         "ssm:GetParameters",
        //         "ssm:GetParameter",
        //       ],
        //       effect: iam.Effect.ALLOW,
        //       resources: ["*"],
        //       // resources: [props.applicationSecrets.parameterArn],
        //     }),
        //   ],
        // }),
      },
    });

    const taskExecutionRole = new iam.Role(this, "BackendTaskExecutionRole", {
      roleName: "backendTaskExecutionRole",
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
        // ecrAccess: new iam.PolicyDocument({
        //   statements: [
        //     new iam.PolicyStatement({
        //       actions: [
        //         "ecr:GetAuthorizationToken",
        //         "ecr:BatchCheckLayerAvailability",
        //         "ecr:GetDownloadUrlForLayer",
        //         "ecr:BatchGetImage",
        //       ],
        //       resources: ["*"],
        //     }),
        //   ],
        // }),
      },
    });

    const backendTaskDefinition = new ecs.Ec2TaskDefinition(
      this,
      "BackendTaskDef",
      {
        taskRole: taskRole,
        executionRole: taskExecutionRole,
        networkMode: ecs.NetworkMode.BRIDGE,
        family: "backend-task",
      }
    );

    backendTaskDefinition.addContainer("backend", {
      containerName: "backend",
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/z2b2a2g2/joopert/fastapi-hello-world:latest"
      ),
      environment: {
        APP_ENV: "backend",
      },
      logging: ecs.LogDriver.awsLogs({
        logGroup: backendLogGroup,
        streamPrefix: "backend",
      }),
      memoryReservationMiB: 128,
      portMappings: [{ containerPort: 80, name: "backend" }],
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
            port: 8001,
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
