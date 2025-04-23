import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { DnsValidatedCertificate } from "@trautonen/cdk-dns-validated-certificate";
import * as r53 from "aws-cdk-lib/aws-route53";
import { config } from "../../config";

export interface CertStackProps extends StackProps {
  hostedZoneSharedAccount: r53.IHostedZone;
}

// This stack is on the shared account
export class CertStack extends Stack {
  public readonly certificate: DnsValidatedCertificate;

  constructor(scope: Construct, id: string, props: CertStackProps) {
    super(scope, id, props);

    const validationRole: iam.IRole = iam.Role.fromRoleArn(
      this,
      "ValidationRole",
      `${config.sharedServicesCertificateRole}-${config.environment}`
    );

    //https://github.com/trautonen/cdk-dns-validated-certificate/blob/main/src/certificate-requestor.lambda.ts#L156
    // might need to update it, so we can add KeyAlgorithm
    //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/acm/command/RequestCertificateCommand/
    this.certificate = new DnsValidatedCertificate(
      this,
      "CrossAccountCertificate",
      {
        validationHostedZones: [
          {
            hostedZone: props.hostedZoneSharedAccount,
            validationRole: validationRole,
          },
        ],
        domainName: config.domain,
      }
    );
  }
}
