import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { getSharedAccountHostedZone } from "../../utils/get-shared-r53-hosted-zone";
import { CognitoCertStack } from "./certificate";
import { UserPoolStack } from "./userpool";

export interface CognitoStackProps extends StackProps {}

export class CognitoStack extends Stack {
  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const hostedZoneSharedAccount = getSharedAccountHostedZone(this);

    const certStack = new CognitoCertStack(this, "CertStack", {
      env: props.env,
      hostedZoneSharedAccount,
    });

    new UserPoolStack(this, "UserPoolStack", {
      env: props.env,
      hostedZone: hostedZoneSharedAccount,
      certificate: certStack.certificate,
    });
  }
}
