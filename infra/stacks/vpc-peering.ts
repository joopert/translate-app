import { Construct } from "constructs";
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { config } from "../config";

interface VpcPeeringStackProps extends StackProps {
  vpc: ec2.Vpc;
}

export class VpcPeeringStack extends Stack {
  public readonly peeringConnection: ec2.CfnVPCPeeringConnection;

  constructor(scope: Construct, id: string, props: VpcPeeringStackProps) {
    super(scope, id, props);

    // Create a VPC peering connection to the shared account VPC
    this.peeringConnection = new ec2.CfnVPCPeeringConnection(
      this,
      "VpcPeeringConnection",
      {
        vpcId: props.vpc.vpcId,
        peerVpcId: config.peeringVpcId,
        // For cross-account peering, specify the AWS account ID
        peerOwnerId: config.peeringVpcOwnerId,
        // For cross-region peering, specify the region
        peerRegion: config.peeringVpcRegion,
        peerRoleArn: config.peeringVpcRoleArn,
        tags: [
          {
            key: "Name",
            value: `${id}-peering-connection`,
          },
        ],
      }
    );

    // Output the peering connection ID for reference
    new CfnOutput(this, "PeeringConnectionId", {
      value: this.peeringConnection.ref,
      description: "VPC Peering Connection ID",
    });

    // Update route tables in your VPC subnets to route traffic to the peer VPC
    // const routeTables = this.getRouteTablesFromVpc(props.vpc);

    // need to add a route in the peer vpc to route to this one back ...

    // routeTables.forEach((routeTable, index) => {
    //   //   // Add route to peer VPC CIDR block via the peering connection
    //   new ec2.CfnRoute(this, `PeerRoute${index}`, {
    //     routeTableId: routeTable.routeTableId,
    //     destinationCidrBlock: "0.0.0.0/0",
    //     vpcPeeringConnectionId: this.peeringConnection.ref,
    //   });
    // });

    // // Note: You will also need to update route tables in the peer VPC
    // // to route traffic back to this VPC. This often requires manual steps
    // // or additional infrastructure code in the peer account.

    // // Output information for manual configuration in peer VPC
    // new CfnOutput(this, "PeerRouteTableUpdateInfo", {
    //   value: `Add routes in the peer VPC route tables to target CIDR ${props.vpc.vpcCidrBlock} via peering connection ${this.peeringConnection.ref}`,
    //   description: "Instructions for updating peer VPC route tables",
    // });
  }

  // Helper method to get all route tables from the VPC that should have peering routes
  // private getRouteTablesFromVpc(vpc: ec2.Vpc): ec2.IRouteTable[] {
  //   const routeTables: ec2.IRouteTable[] = [];

  //   // Get public subnet route tables
  //   // vpc.publicSubnets.forEach((subnet) => {
  //   //   routeTables.push(subnet.routeTable);
  //   // });

  //   // Get private subnet route tables
  //   vpc.privateSubnets.forEach((subnet) => {
  //     routeTables.push(subnet.routeTable);
  //   });

  //   return routeTables;
  // }
}
