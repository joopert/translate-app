import * as cdk from "aws-cdk-lib";
import { VpcStack } from "./stacks/vpc-stack";
import { EcsAppStack } from "./stacks/ecs/ecs-app-stack";
import { ApigwStack } from "./stacks/apigw/apigw-stack";
import { verifyAwsAccount } from "./utils/account-protection";
import { CloudfrontStack } from "./stacks/cloudfront/cloudfront-stack";
import { GithubActionsRoleStack } from "./stacks/github-actions-role";
import { CognitoStack } from "./stacks/cognito/cognito-stack";
import { GenericStack } from "./stacks/generic";
import { EcrStack } from "./stacks/ecr";

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

verifyAwsAccount();

const githubActionsRoleStack = new GithubActionsRoleStack(
  app,
  "GithubRoleStack",
  {
    env,
  }
);

const genericStack = new GenericStack(app, "GenericStack", {
  env,
  githubActionsRole: githubActionsRoleStack.role,
});

const ecrReposStack = new EcrStack(app, "EcrStack", {
  env,
});

const vpcStack = new VpcStack(app, "VpcStack", {
  env,
});

const ecsAppStack = new EcsAppStack(app, "EcsAppStack", {
  env,
  vpc: vpcStack.vpc,
  githubActionsRole: githubActionsRoleStack.role,
  applicationSecrets: genericStack.applicationSecrets,
  ecrBackendRepo: ecrReposStack.backendRepo,
  ecrFrontendRepo: ecrReposStack.frontendRepo,
});

const apigwStack = new ApigwStack(app, "ApigwStack", {
  env,
  vpc: vpcStack.vpc,
  cloudmap: ecsAppStack.cloudmap,
  frontendService: ecsAppStack.frontendService,
  backendService: ecsAppStack.backendService,
});

new CloudfrontStack(app, "CloudfrontStack", {
  env,
  githubActionsRole: githubActionsRoleStack.role,
});

apigwStack.addDependency(ecsAppStack);

new CognitoStack(app, "CognitoStack", {
  env: env,
});
