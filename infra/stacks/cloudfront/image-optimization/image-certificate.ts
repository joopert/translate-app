import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { config } from "../../../config";
import { DnsValidatedCertificate } from "@trautonen/cdk-dns-validated-certificate";
import { getSharedAccountHostedZone } from "../../../utils/get-shared-r53-hosted-zone";

interface ImageCertificateProps extends cdk.StackProps {
  // hostedZone: r53.IHostedZone;
}
export class ImageCertificateStack extends cdk.Stack {
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: ImageCertificateProps) {
    super(scope, id, props);

    const hostedZoneSharedAccount = getSharedAccountHostedZone(this);

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
      "CrossAccountImageCertificate",
      {
        validationHostedZones: [
          {
            hostedZone: hostedZoneSharedAccount,
            validationRole: validationRole,
          },
        ],
        domainName: config.imageDomain,
        certificateRegion: "us-east-1", // cloudfront requires the cert to be in us-east-1
      }
    );
  }
}
