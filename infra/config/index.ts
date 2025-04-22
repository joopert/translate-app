export const config = {
  cidr: "10.1.0.0/20",
  appName: "amfyapp",
  domain: "amfyapp.com",
  sharedServicesAccountNumber: "233108183980",
  sharedServicesHostedZoneId: "Z076379912WYARXJ96QND",
  environment: "dev", //TODO: must be depending on CDK_DEPLOY_STAGE or so.
  peeringVpcId: "vpc-0ad9f1ed4afee37cb",
  peeringVpcCidr: "10.0.0.0/20",
  peeringVpcOwnerId: "233108183980",
  peeringVpcRegion: "eu-west-1",
  peeringVpcRoleArn:
    "arn:aws:iam::233108183980:role/vpc-peering-acceptance-role",
};
