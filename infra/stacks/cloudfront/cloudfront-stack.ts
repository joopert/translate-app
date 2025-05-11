import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { StaticCloudfrontDistributionStack } from "./static/static-distribution";
import { StaticCertificateStack } from "./static/static-certificate";
import { getSharedAccountHostedZone } from "../../utils/get-shared-r53-hosted-zone";
import * as iam from "aws-cdk-lib/aws-iam";
import { ImageCertificateStack } from "./image-optimization/image-certificate";
import { ImageOptimizationStack } from "./image-optimization/image-optimization-stack";
import { config } from "../../config";
export interface CloudfrontStackProps extends StackProps {
  githubActionsRole?: iam.Role;
}

export class CloudfrontStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudfrontStackProps) {
    super(scope, id, props);

    const hostedZoneSharedAccount = getSharedAccountHostedZone(this);
    const blueBucketName = `${config.appName}-${config.environment}-static-blue-${config.uniqueId}`;
    const greenBucketName = `${config.appName}-${config.environment}-static-green-${config.uniqueId}`;
    const lambdaFunctionName = "image-optimization";

    const staticCertificate = new StaticCertificateStack(
      this,
      "StaticCertificate",
      {}
    );

    const imageCertificate = new ImageCertificateStack(
      this,
      "ImageCertificate",
      {}
    );

    const staticDistribution = new StaticCloudfrontDistributionStack(
      this,
      "StaticDistributionStack",
      {
        hostedZone: hostedZoneSharedAccount,
        certificate: staticCertificate.certificate,
        githubActionsRole: props.githubActionsRole,
        blueBucketName,
        greenBucketName,
        lambdaFunctionName: lambdaFunctionName,
      }
    );

    const imageOptimization = new ImageOptimizationStack(
      this,
      "ImageOptimizationStack",
      {
        githubActionsRole: props.githubActionsRole,
        certificate: imageCertificate.certificate,
        blueBucketName,
        greenBucketName,
        lambdaFunctionName: lambdaFunctionName,
      }
    );
    imageOptimization.node.addDependency(staticDistribution);
  }
}
