import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as iam from "aws-cdk-lib/aws-iam";

interface GenericStackProps extends cdk.StackProps {
  githubActionsRole?: iam.Role;
}

export class GenericStack extends cdk.Stack {
  public readonly applicationSecrets: ssm.StringParameter;

  constructor(scope: Construct, id: string, props: GenericStackProps) {
    super(scope, id, props);

    this.applicationSecrets = new ssm.StringParameter(
      this,
      "ApplicationSecretsSSMParameter",
      {
        description: "Parameters store for application secrets",
        parameterName: "application_secrets",
        stringValue: '{"jsondummy": "dummy, this is now ignored in aws cdk"}',
      }
    );
  }
}
