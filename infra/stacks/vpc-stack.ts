import { Construct } from "constructs";
import { Stack, StackProps, Tags } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { config, Environment } from "../config";
import { FckNatInstanceProvider } from "cdk-fck-nat";

interface IVpcStackProps extends StackProps {}

export class VpcStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: IVpcStackProps) {
    super(scope, id, props);

    // const eip = new ec2.CfnEIP(this, "EIP", {}); // only needed when a static ip is required
    const natGatewayProvider = new FckNatInstanceProvider({
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.NANO
      ),
      // eipPool: [eip.attrAllocationId],
      enableSsm: true,
    });

    this.vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr(config.cidr),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 2,
      vpcName: "vpc",
      createInternetGateway: true,
      natGateways: 1,
      natGatewayProvider: natGatewayProvider,
      subnetConfiguration: [
        {
          cidrMask: 23,
          name: "isolated-subnet",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 23,
          name: "public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 23,
          name: "private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],

      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
        DynamoDB: {
          service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        },
      },
    });

    natGatewayProvider.securityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.allTraffic(),
      "Allow traffic from VPC"
    );

    if (config.environment === Environment.dev) {
      natGatewayProvider.autoScalingGroups.forEach((asg) => {
        Tags.of(asg).add("ManagedByScheduler", "true");
      });
    }
  }
}
