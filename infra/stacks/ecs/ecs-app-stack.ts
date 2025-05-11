import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { BackendEcsServiceStack } from "./backend";
import { FrontendEcsServiceStack } from "./frontend";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { EcsClusterStack } from "./cluster";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as ecr from "aws-cdk-lib/aws-ecr";

export interface EcsAppStackProps extends StackProps {
  vpc: ec2.IVpc;
  githubActionsRole?: iam.Role;
  bucket: s3.Bucket;
  applicationSecrets: ssm.StringParameter;
  ecrBackendRepo: ecr.Repository;
  ecrFrontendRepo: ecr.Repository;
}

export class EcsAppStack extends Stack {
  public readonly cloudmap: servicediscovery.INamespace;
  public readonly cluster: ecs.Cluster;
  public readonly frontendService: ecs.Ec2Service;
  public readonly backendService: ecs.Ec2Service;

  constructor(scope: Construct, id: string, props: EcsAppStackProps) {
    super(scope, id, props);

    const clusterStack = new EcsClusterStack(this, "EcsClusterStack", {
      env: props.env,
      vpc: props.vpc,
    });

    const backendStack = new BackendEcsServiceStack(
      this,
      "BackendEcsServiceStack",
      {
        cluster: clusterStack.cluster,
        cloudmap: clusterStack.cloudmap,
        githubActionsRole: props.githubActionsRole,
        bucket: props.bucket,
        applicationSecrets: props.applicationSecrets,
        backendEcrRepo: props.ecrBackendRepo,
      }
    );

    const frontendStack = new FrontendEcsServiceStack(
      this,
      "FrontendEcsServiceStack",
      {
        cluster: clusterStack.cluster,
        cloudmap: clusterStack.cloudmap,
        githubActionsRole: props.githubActionsRole,
        applicationSecrets: props.applicationSecrets,
        frontendEcrRepo: props.ecrFrontendRepo,
      }
    );

    backendStack.addDependency(clusterStack);
    frontendStack.addDependency(clusterStack);

    this.cloudmap = clusterStack.cloudmap;
    this.cluster = clusterStack.cluster;
    this.frontendService = frontendStack.frontendService;
    this.backendService = backendStack.backendService;
  }
}
