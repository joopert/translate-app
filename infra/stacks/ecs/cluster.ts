import { Stack, StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as asg from "aws-cdk-lib/aws-autoscaling";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";

export interface EcsClusterStackProps extends StackProps {
  vpc: ec2.IVpc;
}

export class EcsClusterStack extends Stack {
  public readonly asg: asg.AutoScalingGroup;
  public readonly cluster: ecs.Cluster;
  public readonly cloudmap: servicediscovery.INamespace;
  constructor(scope: Construct, id: string, props: EcsClusterStackProps) {
    super(scope, id, props);

    this.cloudmap = new servicediscovery.HttpNamespace(
      this,
      "CloudmapNamespace",
      {
        name: "app",
        description: "Cloudmap namespace for app",
      }
    );

    this.cluster = new ecs.Cluster(this, "FrontendBackendEcsCluster", {
      vpc: props.vpc,
      clusterName: "app-ecs-cluster",
      // defaultCloudMapNamespace: {
      //   useForServiceConnect: true,
      //   name: "app",
      //   type: servicediscovery.NamespaceType.HTTP,
      // },
    });

    const ecsSg = new ec2.SecurityGroup(this, "EcsFrontendBackendSG", {
      securityGroupName: "Ec2ForEcsSG",
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    ecsSg.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcpRange(32768, 65535),
      "Frontend ephemeral ports from private subnet to ECS"
      // needed because multiple tasks can be running on the same instance
      // and it uses different ports in that range
    );
    // TODO: need to test if we remove the SG, if it still works. I somehow remember that we need it as services need to communicate on ephemeral ports
    const ec2InstanceRoleForEcs = new iam.Role(this, "ec2InstanceRoleForEcs", {
      roleName: "ec2InstanceRoleForEcs",
      description: "Role for EC2 instances in the ECS cluster",
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonEC2ContainerServiceforEC2Role"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore"
        ),
      ],
    });

    this.asg = new asg.AutoScalingGroup(this, "ASG", {
      vpc: props.vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
        // need to explain that we're using a ec2 with twice the memory needed, because during deployment ecs will complain
      ), // https://github.com/aws/amazon-ecs-agent/issues/4397 changed from ARM to this because of issue.
      machineImage: ecs.EcsOptimizedImage.amazonLinux2023(
        ecs.AmiHardwareType.ARM
      ),
      desiredCapacity: 1,
      minCapacity: 1,
      maxCapacity: 1,
      vpcSubnets: {
        subnets: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }).subnets,
      },
      securityGroup: ecsSg,
      autoScalingGroupName: "ASG-ECS",
      requireImdsv2: true,
      spotPrice: "0.005",
      capacityRebalance: true,
      role: ec2InstanceRoleForEcs,
    });

    //docs.aws.amazon.com/cloud-map/latest/dg/security-iam-awsmanpol.html
    const capacityProvider = new ecs.AsgCapacityProvider(
      this,
      "capacityProvider",
      {
        autoScalingGroup: this.asg,
        spotInstanceDraining: true,
        capacityProviderName: "cp-fe-be-asg", // Must not start with 'aws', 'ecs', or 'fargate'
      }
    );
    this.cluster.addAsgCapacityProvider(capacityProvider);
  }
}
