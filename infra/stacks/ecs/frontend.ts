import { Stack, StackProps } from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";

export interface FrontendEcsServiceStackProps extends StackProps {
  cluster: ecs.Cluster;
  cloudmap: servicediscovery.INamespace;
}

export class FrontendEcsServiceStack extends Stack {
  public readonly frontendService: ecs.Ec2Service;

  constructor(
    scope: Construct,
    id: string,
    props: FrontendEcsServiceStackProps
  ) {
    super(scope, id, props);
    const frontendLogGroup = new logs.LogGroup(this, "FrontendLogGroup", {
      logGroupName: "frontend",
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskRole = new iam.Role(this, "ecsTaskRoleFrontend", {
      roleName: "ecsTaskRoleFrontend",
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

    const taskExecutionRole = new iam.Role(this, "FrontendTaskExecutionRole", {
      roleName: "frontendTaskExecutionRole",
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
              resources: [`${frontendLogGroup.logGroupArn}:*`],
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

    const frontendTaskDefinition = new ecs.Ec2TaskDefinition(
      this,
      "FrontendTaskDef",
      {
        taskRole: taskRole,
        executionRole: taskExecutionRole,
        family: "frontend-task",
        networkMode: ecs.NetworkMode.BRIDGE, // aws_vpc is recommended. But it will use a seperate ENI. A t4g.medium only has max 3 ENI's so max 2 containers per ec2.
      }
    );

    frontendTaskDefinition.addContainer("frontend", {
      containerName: "frontend",
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/z2b2a2g2/joopert/fastapi-hello-world:latest"
      ),
      environment: {
        APP_ENV: "frontend",
      },
      logging: ecs.LogDriver.awsLogs({
        logGroup: frontendLogGroup,
        streamPrefix: "frontend",
      }),
      memoryReservationMiB: 128,
      portMappings: [{ containerPort: 80, name: "frontend" }], //TODO: set to correct port
    });

    this.frontendService = new ecs.Ec2Service(this, "frontendEcsService", {
      cluster: props.cluster,
      taskDefinition: frontendTaskDefinition,
      enableExecuteCommand: true,
      serviceName: "frontend",
      circuitBreaker: {
        enable: true,
      },
      serviceConnectConfiguration: {
        namespace: props.cloudmap.namespaceName,
        services: [
          {
            dnsName: "frontend",
            port: 3000,
            portMappingName: "frontend",
          },
        ],
      },
    });
  }
}
