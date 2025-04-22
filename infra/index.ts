import * as cdk from "aws-cdk-lib";
import { VpcStack } from "./stacks/vpc-stack";
import { EcsAppStack } from "./stacks/ecs/ecs-app-stack";
import { ApigwStack } from "./stacks/apigw/apigw-stack";
import { verifyAwsAccount } from "./utils/account-protection";
import { CloudfrontStack } from "./stacks/cloudfront/cloudfront-stack";

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

verifyAwsAccount();

const vpcStack = new VpcStack(app, "VpcStack", {
  env,
});

const ecsAppStack = new EcsAppStack(app, "EcsAppStack", {
  env,
  vpc: vpcStack.vpc,
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
});

apigwStack.addDependency(ecsAppStack);
