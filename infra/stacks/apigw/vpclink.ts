import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { config } from "../../config";

export interface VpcLinkStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class VpcLinkStack extends cdk.Stack {
  public readonly vpcLink: apigw.VpcLink;
  constructor(scope: Construct, id: string, props: VpcLinkStackProps) {
    super(scope, id, props);

    const vpcLinkSg = new ec2.SecurityGroup(this, "VpcLinkSecurityGroup", {
      vpc: props.vpc,
      allowAllOutbound: true,
    });
    vpcLinkSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic());

    this.vpcLink = new apigw.VpcLink(this, "VpcLink", {
      vpc: props.vpc,
      vpcLinkName: `${config.appName}-vpcLink`,

      securityGroups: [vpcLinkSg],
    });
  }
}
