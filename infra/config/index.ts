export enum Environment {
  dev = "dev",
  prod = "prod",
}

export interface Config {
  cidr: string;
  appName: string;
  domain: string;
  staticDomain: string;
  sharedServicesAccountNumber: string;
  sharedServicesHostedZoneId: string;
  sharedServicesHostedZoneName: string;
  sharedServicesCertificateRole: string;
  environment: Environment;
  peeringVpcEnabled: boolean;
  peeringVpcId: string;
  peeringVpcCidr: string;
  peeringVpcOwnerId: string;
  peeringVpcRegion: string;
  peeringVpcRoleArn: string;
  githubActionsRole: {
    allowedRepositories: string[];
  };
}

const baseConfig: Partial<Config> = {
  appName: "amfyapp",
  sharedServicesAccountNumber: "233108183980",
  sharedServicesHostedZoneId: "Z076379912WYARXJ96QND",
  sharedServicesHostedZoneName: "amfyapp.com",
  sharedServicesCertificateRole: `arn:aws:iam::233108183980:role/AmfyappRoute53CrossAccountCertRole`,
  peeringVpcEnabled: false,
  peeringVpcRegion: "eu-west-1",
  peeringVpcId: "vpc-0ad9f1ed4afee37cb",
  peeringVpcCidr: "10.0.0.0/20",
  peeringVpcOwnerId: "233108183980",
  peeringVpcRoleArn:
    "arn:aws:iam::233108183980:role/vpc-peering-acceptance-role",
  githubActionsRole: {
    allowedRepositories: [""],
  },
};

const environmentConfigs: Record<Environment, Partial<Config>> = {
  //cidr ranges, the 2nd octet is the app (amfyapp, pickyourflight), the 3rd octet is the environment (0=dev, 16=test, 32=acc, 48=prod)
  //dev: 10.1.0.0/20
  //test: 10.1.16.0/20
  //acc: 10.1.32.0/20
  //prod: 10.1.48.0/20

  [Environment.dev]: {
    cidr: "10.1.0.0/20",
    domain: "dev.amfyapp.com",
    staticDomain: "static.dev.amfyapp.com",
    environment: Environment.dev,
  },

  [Environment.prod]: {
    cidr: "10.1.48.0/20",
    domain: "amfyapp.com",
    staticDomain: "static.amfyapp.com",
    environment: Environment.prod,
  },
};

const stage = process.env.CDK_DEPLOY_STAGE as Environment;

export const config: Config = {
  ...baseConfig,
  ...environmentConfigs[stage],
} as Config;
