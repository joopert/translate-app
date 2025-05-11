import * as ec2 from "aws-cdk-lib/aws-ec2";

export enum Environment {
  dev = "dev",
  prod = "prod",
}

export interface PeeringOptions {
  vpcId: string;
  vpcCidr: string;
  vpcOwnerId: string;
  vpcRegion: string;
  vpcRoleArn: string;
}
export interface Config {
  /**
   * The CIDR block for the VPC network allocation in AWS.
   * Defines the IP address range for resources within the VPC.
   */
  cidr: string;

  /**
   * The name of the application which is used across resources for naming and tagging.
   * Used for resource identification and organization.
   */
  appName: string;

  /**
   * The primary domain for the application. This is the base domain used for
   * the main application interface. e.g. pickyourflight.com
   */
  domain: string;

  /**
   * Domain for static assets like CSS, JavaScript, and images served from CDN.
   * Typically fronts an S3 bucket via CloudFront for optimized asset delivery.
   */
  staticDomain: string;

  /**
   * Domain for optimized images served through the image processing pipeline.
   * Used by the image optimization Lambda to serve resized/processed images.
   */
  imageDomain: string;

  /**
   * Domain for authentication services. Typically used for the Cognito hosted UI
   * or other authentication-related endpoints.
   */
  authDomain: string;

  /**
   * List of URLs that are allowed as callback/redirect URIs for the authentication flow.
   * These are registered with identity providers to ensure secure redirects after authentication.
   */
  callbackUrls: string[];

  /**
   * The AWS account number for the shared services account which hosts
   * central/common resources like DNS zones.
   */
  sharedServicesAccountNumber: string;

  /**
   * The Route53 hosted zone ID in the shared services account.
   * This zone hosts the DNS records for the application domains.
   */
  sharedServicesHostedZoneId: string;

  /**
   * The domain name associated with the hosted zone in the shared services account.
   * This is the root domain under which application subdomains are created.
   */
  sharedServicesHostedZoneName: string;

  /**
   * The ARN of the IAM role that allows the application stack to request and validate
   * ACM certificates using the shared Route53 hosted zone for domain validation.
   */
  sharedServicesCertificateRole: string;

  /**
   * The name of the IAM role in the shared services account that allows cross-account access
   * to Route53 resources. This role is used for DNS record management across AWS accounts,
   * enabling the infrastructure in one account to create and manage DNS records in the
   * Route53 hosted zone that belongs to the shared services account.
   */
  sharedServicesRoute53CrossAccountDomainRole: string;

  /**
   * The deployment environment (dev, prod) that determines which configuration set to use.
   * Controls environment-specific settings and behavior.
   */
  environment: Environment;

  /**
   * A unique identifier for the application.
   * Used to ensure that resources are unique across accounts and regions.
   */
  uniqueId: string;

  /**
   * Flag indicating whether VPC peering should be enabled.
   * When true, sets up network connectivity between the application VPC and other VPCs.
   */
  peeringVpcEnabled: boolean;

  /**
   * Configuration options for VPC peering when enabled.
   * Contains details about the peer VPC to establish connectivity with.
   */
  peeringVpcOptions: PeeringOptions;

  /**
   * Configuration for GitHub Actions OIDC integration with AWS.
   * Defines which repositories are allowed to assume roles for CI/CD workflows.
   */
  githubActionsRole: {
    /**
     * List of GitHub repositories that are allowed to assume the GitHub Actions role.
     * Format: "owner/repo"
     */
    allowedRepositories: string[];
  };

  /**
   * EC2 instance configurations for different application components.
   * Defines the instance types and pricing models for various services.
   */
  ec2Ec2: {
    /**
     * Configuration for EC2 instances running the frontend and backend services.
     */
    frontendBackend: {
      /**
       * Maximum price willing to pay for a Spot Instance.
       * Used when provisioning EC2 instances with the Spot pricing model.
       */
      spotPrice: string;

      /**
       * The EC2 instance type (family and size) to use for frontend/backend servers.
       * Determines CPU, memory, and other hardware characteristics.
       */
      instanceType: ec2.InstanceType;
    };
  };
}

const baseConfig: Partial<Config> = {
  appName: "amfyapp",
  uniqueId: "8ad5e5e6",
  sharedServicesAccountNumber: "233108183980",
  sharedServicesHostedZoneId: "Z076379912WYARXJ96QND",
  sharedServicesHostedZoneName: "amfyapp.com",
  sharedServicesCertificateRole: `arn:aws:iam::233108183980:role/AmfyappRoute53CrossAccountCertRole`,
  peeringVpcEnabled: false,
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
    environment: Environment.dev,
    cidr: "10.1.0.0/20",
    domain: "dev.amfyapp.com",
    staticDomain: "static.dev.amfyapp.com",
    authDomain: "auth.dev.amfyapp.com",
    imageDomain: "images.dev.amfyapp.com",
    callbackUrls: [
      "http://localhost:8001/auth/callback",
      "https://dev.amfyapp.com/api/v1/auth/callback",
    ],
    ec2Ec2: {
      frontendBackend: {
        spotPrice: "0.009",
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.SMALL
        ),
      },
    },
  },

  [Environment.prod]: {
    environment: Environment.prod,
    cidr: "10.1.48.0/20",
    domain: "amfyapp.com",
    staticDomain: "static.amfyapp.com",
    authDomain: "auth.dev.amfyapp.com",
    imageDomain: "images.dev.amfyapp.com",
    callbackUrls: [
      "http://localhost:8001/auth/callback",
      "https://amfyapp.com/api/v1/auth/callback",
    ],
    ec2Ec2: {
      frontendBackend: {
        spotPrice: "0.009",
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.SMALL
        ),
      },
    },
  },
};

const stage = process.env.CDK_DEPLOY_STAGE as Environment;

export const config: Config = {
  ...baseConfig,
  ...environmentConfigs[stage],
} as Config;
