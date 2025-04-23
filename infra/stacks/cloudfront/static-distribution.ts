import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { CrossAccountRoute53RecordSet } from "cdk-cross-account-route53";
import { Construct } from "constructs";
import { config } from "../../config";
import * as iam from "aws-cdk-lib/aws-iam";

interface StaticCloudfrontDistributionProps extends cdk.StackProps {
  hostedZone: route53.IHostedZone;
  certificate: acm.ICertificate;
  githubActionsRole?: iam.Role;
}

export class StaticCloudfrontDistributionStack extends cdk.Stack {
  public readonly greenBucket: s3.Bucket;
  public readonly blueBucket: s3.Bucket;
  public readonly blueGreenParameter: ssm.StringParameter;

  constructor(
    scope: Construct,
    id: string,
    props: StaticCloudfrontDistributionProps
  ) {
    super(scope, id, props);

    this.blueGreenParameter = new ssm.StringParameter(
      this,
      "BlueGreenDeploymentParameter",
      {
        parameterName: "current-blue-green-deployment",
        stringValue: "blue",
        description: "Current active deployment in blue/green strategy",
      }
    );
    this.greenBucket = new s3.Bucket(this, "GreenBucket", {
      bucketName: `${config.appName}-${config.environment}-static-green-e30913b6`,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: [
            `https://${config.domain}`,
            `https://${config.staticDomain}`,
          ],

          exposedHeaders: ["ETag"],
          maxAge: 3600,
        },
      ],
    });

    this.blueBucket = new s3.Bucket(this, "blueBucket", {
      bucketName: `${config.appName}-${config.environment}-static-blue-e30913b6`,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: [
            `https://${config.domain}`,
            `https://${config.staticDomain}`,
          ],
          exposedHeaders: ["ETag"],
          maxAge: 3600,
        },
      ],
    });

    const originGroup = new origins.OriginGroup({
      primaryOrigin: origins.S3BucketOrigin.withOriginAccessControl(
        this.greenBucket,
        {
          originId: "GreenBucket",
          originAccessControl: new cloudfront.S3OriginAccessControl(
            this,
            "OriginAccessControlGreen",
            {}
          ),
        }
      ),

      fallbackOrigin: origins.S3BucketOrigin.withOriginAccessControl(
        this.blueBucket,
        {
          originId: "BlueBucket",
          originAccessControl: new cloudfront.S3OriginAccessControl(
            this,
            "OriginAccessControlBlue",
            {}
          ),
        }
      ),
      fallbackStatusCodes: [403, 404], // since s3 is not public, it will not give a 404 but a 403
    });

    const cachePolicy = new cloudfront.CachePolicy(
      this,
      `${config.appName}CachePolicy`,
      {
        cachePolicyName: `${config.appName}-CachePolicy`,
        comment: `A custom cache policy ${config.appName}`,
        defaultTtl: cdk.Duration.days(30),
        minTtl: cdk.Duration.days(24),
        maxTtl: cdk.Duration.days(365),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        headerBehavior: cloudfront.CacheHeaderBehavior.none(),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
      }
    );

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: originGroup,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        cachePolicy: {
          cachePolicyId: cachePolicy.cachePolicyId,
        },
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        responseHeadersPolicy:
          cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
      },
      domainNames: [config.staticDomain],
      certificate: props.certificate,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    new CrossAccountRoute53RecordSet(this, "ARecord", {
      delegationRoleName: `AmfyappRoute53CrossAccountDomainRole-${config.environment}`,
      delegationRoleAccount: config.sharedServicesAccountNumber,
      hostedZoneId: config.sharedServicesHostedZoneId,
      resourceRecordSets: [
        {
          Name: config.staticDomain,
          Type: "A",
          AliasTarget: {
            DNSName: distribution.distributionDomainName,
            HostedZoneId: "Z2FDTNDATAQYW2", // hardcoded by AWS: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-route53-recordset-aliastarget.html#cfn-route53-recordset-aliastarget-hostedzoneid
            EvaluateTargetHealth: false,
          },
        },
      ],
    });

    if (props.githubActionsRole) {
      props.githubActionsRole.addToPolicy(
        new iam.PolicyStatement({
          sid: "S3Access",
          actions: [
            "s3:PutObject",
            "s3:GetObject",
            "s3:DeleteObject",
            "s3:ListBucket",
          ],
          effect: iam.Effect.ALLOW,
          resources: [
            this.blueBucket.bucketArn,
            this.blueBucket.arnForObjects("*"),
            this.greenBucket.bucketArn,
            this.greenBucket.arnForObjects("*"),
          ],
        })
      );

      props.githubActionsRole.addToPolicy(
        new iam.PolicyStatement({
          sid: "SSMAccess",
          actions: [
            "ssm:DescribeParameters",
            "ssm:GetParameters",
            "ssm:GetParameter",
            "ssm:PutParameter",
          ],
          resources: [this.blueGreenParameter.parameterArn],
          effect: iam.Effect.ALLOW,
        })
      );
    }
  }
}
