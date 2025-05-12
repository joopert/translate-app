import { Stack, StackProps } from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";
import { config } from "../../config";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as ecr from "aws-cdk-lib/aws-ecr";

export interface FrontendEcsServiceStackProps extends StackProps {
  cluster: ecs.Cluster;
  cloudmap: servicediscovery.INamespace;
  githubActionsRole?: iam.Role;
  applicationSecrets: ssm.StringParameter;
  frontendEcrRepo: ecr.Repository;
}

export class FrontendEcsServiceStack extends Stack {
  public readonly frontendService: ecs.Ec2Service;
  public readonly taskRoleFrontend: iam.Role;

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

    this.taskRoleFrontend = new iam.Role(this, "ecsTaskRoleFrontend", {
      roleName: "ecsTaskRoleFrontend",
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

    const taskExecutionRole = new iam.Role(this, "FrontendTaskExecutionRole", {
      roleName: "frontendTaskExecutionRole", // this role name is used in the shared account cdk code
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
        ecrAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
              ],
              resources: [props.frontendEcrRepo.repositoryArn],
            }),
          ],
        }),
      },
    });

    const frontendTaskDefinition = new ecs.Ec2TaskDefinition(
      this,
      "FrontendTaskDef",
      {
        taskRole: this.taskRoleFrontend,
        executionRole: taskExecutionRole,
        family: "frontend-task",
        networkMode: ecs.NetworkMode.BRIDGE, // aws_vpc is recommended. But it will use a seperate ENI. A t4g.medium only has max 3 ENI's so max 2 containers per ec2.
      }
    );

    frontendTaskDefinition.addContainer("frontend", {
      containerName: "frontend",
      image: ecs.ContainerImage.fromEcrRepository(
        props.frontendEcrRepo,
        "latest"
      ),
      environment: {
        APP_ENV: "frontend",
        ENVIRONMENT: config.environment,
        NUXT_PUBLIC_BASE_URL: `https://${config.domain}`,
        NUXT_APP_CDN_URL: `https://${config.staticDomain}`,
        // IMAGE_CLOUDFRONT_URL: props.cloudfrontUrl, //`https://${domainName}.s3.amazonaws.com`,
        // NUXT_API_SERVICE_NAME: config.internalService, probably not needed anymore, used by nuxt ssr base url
        // NUXT_API_DOMAIN: config.internalUrl, probably not needed anymore, used by nuxt ssr base url
        NUXT_SITE_URL: `https://${config.domain}`,
        NUXT_PUBLIC_LOG_LEVEL: "info",
        NUXT_PUBLIC_IMAGE_CDN: `https://${config.imageDomain}`, // this comes from the separate cdk project for image optimization
      },
      logging: ecs.LogDriver.awsLogs({
        logGroup: frontendLogGroup,
        streamPrefix: "frontend",
      }),
      memoryReservationMiB: 128,
      portMappings: [{ containerPort: 3000, name: "frontend" }],
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

    if (props.githubActionsRole) {
      props.githubActionsRole.addToPolicy(
        new iam.PolicyStatement({
          sid: "EcsUpdateService",
          actions: ["ecs:UpdateService"],
          effect: iam.Effect.ALLOW,
          resources: [this.frontendService.serviceArn],
        })
      );
    }
  }
}
