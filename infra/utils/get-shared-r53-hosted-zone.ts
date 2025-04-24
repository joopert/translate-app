import { Construct } from "constructs";
import * as r53 from "aws-cdk-lib/aws-route53";
import { config } from "../config";

/**
 * Utility to retrieve a shared account Route 53 hosted zone by attributes.
 * @param scope CDK Construct (usually the app or stack)
 */
export function getSharedAccountHostedZone(scope: Construct): r53.IHostedZone {
  return r53.HostedZone.fromHostedZoneAttributes(
    scope,
    "HostedZoneSharedAccount",
    {
      hostedZoneId: config.sharedServicesHostedZoneId,
      zoneName: config.sharedServicesHostedZoneName,
    }
  );
}
