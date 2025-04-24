import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";
import { HttpApiStack } from "./httpapi";
import { VpcLinkStack } from "./vpclink";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { CertStack } from "./certificate";
import { getSharedAccountHostedZone } from "../../utils/get-shared-r53-hosted-zone";

export interface ApigwStackProps extends StackProps {
  vpc: ec2.IVpc;
  cloudmap: servicediscovery.IPrivateDnsNamespace;
  frontendService: ecs.Ec2Service;
  backendService: ecs.Ec2Service;
}

export class ApigwStack extends Stack {
  constructor(scope: Construct, id: string, props: ApigwStackProps) {
    super(scope, id, props);

    const hostedZoneSharedAccount = getSharedAccountHostedZone(this);

    const vpcLinkStack = new VpcLinkStack(this, "VpcLinkStack", {
      env: props.env,
      vpc: props.vpc,
    });

    const certStack = new CertStack(this, "CertStack", {
      env: props.env,
      hostedZoneSharedAccount,
    });

    const httpApiStack = new HttpApiStack(this, "HttpApiStack", {
      env: props.env,
      vpc: props.vpc,
      cloudmap: props.cloudmap,
      vpcLink: vpcLinkStack.vpcLink,
      frontendService: props.frontendService,
      backendService: props.backendService,
      certificate: certStack.certificate,
      hostedZone: hostedZoneSharedAccount,
    });
    httpApiStack.addDependency(vpcLinkStack);
  }
}
