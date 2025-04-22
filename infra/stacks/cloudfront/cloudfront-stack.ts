import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { StaticCloudfrontDistributionStack } from "./static-distribution";
import { StaticCertificateStack } from "./static-certificate";
import { getSharedAccountHostedZone } from "../r53-hosted-zone";
import * as iam from "aws-cdk-lib/aws-iam";

export interface CloudfrontStackProps extends StackProps {
  githubActionsRole?: iam.Role;
}

export class CloudfrontStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudfrontStackProps) {
    super(scope, id, props);

    const hostedZoneSharedAccount = getSharedAccountHostedZone(this);
    const certificate = new StaticCertificateStack(this, "Certificate", {});

    new StaticCloudfrontDistributionStack(this, "Distribution", {
      hostedZone: hostedZoneSharedAccount,
      certificate: certificate.certificate,
      githubActionsRole: props.githubActionsRole,
    });
  }
}
