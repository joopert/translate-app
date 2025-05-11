// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
  Fn,
  Stack,
  StackProps,
  RemovalPolicy,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_lambda as lambda,
  aws_iam as iam,
  Duration,
  CfnOutput,
  aws_logs as logs,
} from "aws-cdk-lib";
import { CfnDistribution } from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { getOriginShieldRegion } from "./origin-shield";
import * as path from "path";
import { config } from "../../../config";
import { CrossAccountRoute53RecordSet } from "cdk-cross-account-route53";

// related to architecture. If set to false, transformed images are not stored in S3, and all image requests land on Lambda
var STORE_TRANSFORMED_IMAGES = "true";
// Parameters of S3 bucket where original images are stored
var S3_IMAGE_BUCKET_NAME: string;
// CloudFront parameters
var CLOUDFRONT_ORIGIN_SHIELD_REGION = getOriginShieldRegion(
  process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || "us-east-1"
);
var CLOUDFRONT_CORS_ENABLED = "true";
// Parameters of transformed images
var S3_TRANSFORMED_IMAGE_EXPIRATION_DURATION = "90";
var S3_TRANSFORMED_IMAGE_CACHE_TTL = "max-age=31622400";
// Max image size in bytes. If generated images are stored on S3, bigger images are generated, stored on S3
// and request is redirect to the generated image. Otherwise, an application error is sent.
var MAX_IMAGE_SIZE = "4700000";
// Lambda Parameters
var LAMBDA_MEMORY = "1500";
var LAMBDA_TIMEOUT = "60";
// Whether to deploy a sample website referenced in https://aws.amazon.com/blogs/networking-and-content-delivery/image-optimization-using-amazon-cloudfront-and-aws-lambda/
var DEPLOY_SAMPLE_WEBSITE = "false";

type ImageDeliveryCacheBehaviorConfig = {
  origin: any;
  compress: any;
  viewerProtocolPolicy: any;
  cachePolicy: any;
  functionAssociations: any;
  responseHeadersPolicy?: any;
};

type LambdaEnv = {
  originalImageBucketName: string;
  transformedImageBucketName?: any;
  transformedImageCacheTTL: string;
  maxImageSize: string;
};

export interface ImageOptimizationStackProps extends StackProps {
  storeTransformedImages?: boolean;
  s3TransformedImageExpirationDuration?: number;
  s3TransformedImageCacheTtl?: number | string;
  s3ImageBucketName?: string;
  cloudfrontOriginShieldRegion?: string;
  cloudfrontCorsEnabled?: boolean;
  lambdaMemory?: number;
  lambdaTimeout?: number;
  maxImageSize?: number;
  deploySampleWebsite?: boolean;
  certificate: acm.ICertificate;
  githubActionsRole?: iam.Role;
  blueBucketName: string;
  greenBucketName: string;
  lambdaFunctionName: string;
}

export class ImageOptimizationStack extends Stack {
  readonly lambda: lambda.Function;
  constructor(
    scope: Construct,
    id: string,
    props: ImageOptimizationStackProps
  ) {
    super(scope, id, props);

    //Done to break cyclic dependency
    const greenBucket = s3.Bucket.fromBucketName(
      this,
      "GreenBucket",
      props.greenBucketName
    );
    const blueBucket = s3.Bucket.fromBucketName(
      this,
      "BlueBucket",
      props.blueBucketName
    );

    // Change stack parameters based on provided context or props (typed), then convert to string
    STORE_TRANSFORMED_IMAGES = String(
      props.storeTransformedImages ?? STORE_TRANSFORMED_IMAGES
    );
    S3_TRANSFORMED_IMAGE_EXPIRATION_DURATION = String(
      props.s3TransformedImageExpirationDuration ??
        S3_TRANSFORMED_IMAGE_EXPIRATION_DURATION
    );
    S3_TRANSFORMED_IMAGE_CACHE_TTL = String(
      props.s3TransformedImageCacheTtl ?? S3_TRANSFORMED_IMAGE_CACHE_TTL
    );
    S3_IMAGE_BUCKET_NAME = String(
      props.s3ImageBucketName ?? S3_IMAGE_BUCKET_NAME
    );
    CLOUDFRONT_ORIGIN_SHIELD_REGION = String(
      props.cloudfrontOriginShieldRegion ?? CLOUDFRONT_ORIGIN_SHIELD_REGION
    );
    CLOUDFRONT_CORS_ENABLED = String(
      props.cloudfrontCorsEnabled ?? CLOUDFRONT_CORS_ENABLED
    );
    LAMBDA_MEMORY = String(props.lambdaMemory ?? LAMBDA_MEMORY);
    LAMBDA_TIMEOUT = String(props.lambdaTimeout ?? LAMBDA_TIMEOUT);
    MAX_IMAGE_SIZE = String(props.maxImageSize ?? MAX_IMAGE_SIZE);
    DEPLOY_SAMPLE_WEBSITE = String(
      props.deploySampleWebsite ?? DEPLOY_SAMPLE_WEBSITE
    );

    // For the bucket having original images, either use an external one, or create one with some samples photos.
    var originalImageBucket;
    var transformedImageBucket;

    if (S3_IMAGE_BUCKET_NAME) {
      originalImageBucket = s3.Bucket.fromBucketName(
        this,
        "imported-original-image-bucket",
        S3_IMAGE_BUCKET_NAME
      );
      new CfnOutput(this, "OriginalImagesS3Bucket", {
        description: "S3 bucket where original images are stored",
        value: originalImageBucket.bucketName,
      });
    } else {
      originalImageBucket = new s3.Bucket(
        this,
        "s3-sample-original-image-bucket",
        {
          removalPolicy: RemovalPolicy.DESTROY,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
          encryption: s3.BucketEncryption.S3_MANAGED,
          enforceSSL: true,
          autoDeleteObjects: true,
        }
      );
      new s3deploy.BucketDeployment(this, "DeployWebsite", {
        sources: [s3deploy.Source.asset("./image-sample")],
        destinationBucket: originalImageBucket,
        destinationKeyPrefix: "images/rio/",
      });
      new CfnOutput(this, "OriginalImagesS3Bucket", {
        description: "S3 bucket where original images are stored",
        value: originalImageBucket.bucketName,
      });
    }

    // create bucket for transformed images if enabled in the architecture
    if (STORE_TRANSFORMED_IMAGES === "true") {
      transformedImageBucket = new s3.Bucket(
        this,
        "s3-transformed-image-bucket",
        {
          removalPolicy: RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          lifecycleRules: [
            {
              expiration: Duration.days(
                parseInt(S3_TRANSFORMED_IMAGE_EXPIRATION_DURATION)
              ),
            },
          ],
        }
      );
    }

    // prepare env variable for Lambda
    var lambdaEnv: LambdaEnv = {
      originalImageBucketName: blueBucket.bucketName, //TODO: should see if we can get this from ssm parameter current deployment, but it's not there on first deployment
      transformedImageCacheTTL: S3_TRANSFORMED_IMAGE_CACHE_TTL,
      maxImageSize: MAX_IMAGE_SIZE,
    };
    if (transformedImageBucket)
      lambdaEnv.transformedImageBucketName = transformedImageBucket.bucketName;

    // IAM policy to read from the S3 bucket containing the original images

    var iamPolicyStatements: iam.PolicyStatement[] = [];

    iamPolicyStatements.push(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:ListBucket"],
        resources: [
          `arn:aws:s3:::${greenBucket.bucketName}/images/*`,
          `arn:aws:s3:::${greenBucket.bucketName}`,
        ],
      })
    );
    iamPolicyStatements.push(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:ListBucket"],
        resources: [
          `arn:aws:s3:::${blueBucket.bucketName}/images/*`,
          `arn:aws:s3:::${blueBucket.bucketName}`,
        ],
      })
    );

    // Create Lambda for image processing
    var lambdaProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__filename, "../functions/image-processing")
      ),
      timeout: Duration.seconds(parseInt(LAMBDA_TIMEOUT)),
      memorySize: parseInt(LAMBDA_MEMORY),
      environment: lambdaEnv,
      logRetention: logs.RetentionDays.ONE_DAY,
    };
    this.lambda = new lambda.Function(this, "image-optimization", {
      ...lambdaProps,
      functionName: props.lambdaFunctionName,
    });
    if (props.githubActionsRole) {
      props.githubActionsRole.addToPrincipalPolicy(
        new iam.PolicyStatement({
          actions: [
            "lambda:UpdateFunctionCode",
            "lambda:GetFunctionConfiguration",
            "lambda:GetFunction",
            "lambda:UpdateFunctionConfiguration",
          ],
          resources: [this.lambda.functionArn],
        })
      );
    }

    // Enable Lambda URL
    const imageProcessingURL = this.lambda.addFunctionUrl();

    // Leverage CDK Intrinsics to get the hostname of the Lambda URL
    const imageProcessingDomainName = Fn.parseDomainName(
      imageProcessingURL.url
    );

    // Create a CloudFront origin: S3 with fallback to Lambda when image needs to be transformed, otherwise with Lambda as sole origin
    var imageOrigin;

    if (transformedImageBucket) {
      imageOrigin = new origins.OriginGroup({
        primaryOrigin: origins.S3BucketOrigin.withOriginAccessControl(
          transformedImageBucket,
          {
            originShieldRegion: CLOUDFRONT_ORIGIN_SHIELD_REGION,
            originAccessControl: new cloudfront.S3OriginAccessControl(
              this,
              "TransformedImagesBucketOAC",
              {
                description:
                  "Origin Access Control for transformed images bucket",
              }
            ),
          }
        ),
        fallbackOrigin: new origins.HttpOrigin(imageProcessingDomainName, {
          originShieldRegion: CLOUDFRONT_ORIGIN_SHIELD_REGION,
        }),
        fallbackStatusCodes: [403, 500, 503, 504],
      });

      // write policy for Lambda on the s3 bucket for transformed images
      var s3WriteTransformedImagesPolicy = new iam.PolicyStatement({
        actions: ["s3:PutObject"],
        resources: ["arn:aws:s3:::" + transformedImageBucket.bucketName + "/*"],
      });
      iamPolicyStatements.push(s3WriteTransformedImagesPolicy);
    } else {
      imageOrigin = new origins.HttpOrigin(imageProcessingDomainName, {
        originShieldRegion: CLOUDFRONT_ORIGIN_SHIELD_REGION,
      });
    }

    // attach iam policy to the role assumed by Lambda
    this.lambda.role?.attachInlinePolicy(
      new iam.Policy(this, "read-write-bucket-policy", {
        statements: iamPolicyStatements,
      })
    );

    // Create a CloudFront Function for url rewrites
    const urlRewriteFunction = new cloudfront.Function(this, "urlRewrite", {
      code: cloudfront.FunctionCode.fromFile({
        filePath: path.join(__filename, "../functions/url-rewrite/index.js"),
      }),
      functionName: `urlRewriteFunction${this.node.addr}`,
    });

    var imageDeliveryCacheBehaviorConfig: ImageDeliveryCacheBehaviorConfig = {
      origin: imageOrigin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      compress: false,
      cachePolicy: new cloudfront.CachePolicy(
        this,
        `ImageCachePolicy${this.node.addr.substring(0, 10)}`,
        {
          defaultTtl: Duration.hours(24),
          maxTtl: Duration.days(365),
          minTtl: Duration.seconds(0),
        }
      ),
      functionAssociations: [
        {
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          function: urlRewriteFunction,
        },
      ],
    };

    if (CLOUDFRONT_CORS_ENABLED === "true") {
      // Creating a custom response headers policy. CORS allowed for all origins.
      const imageResponseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
        this,
        `ResponseHeadersPolicy${this.node.addr}`,
        {
          responseHeadersPolicyName: `ImageResponsePolicy${this.node.addr}`,
          corsBehavior: {
            accessControlAllowCredentials: false,
            accessControlAllowHeaders: ["*"],
            accessControlAllowMethods: ["GET"],
            accessControlAllowOrigins: ["*"],
            accessControlMaxAge: Duration.seconds(600),
            originOverride: false,
          },
          // recognizing image requests that were processed by this solution
          customHeadersBehavior: {
            customHeaders: [
              {
                header: "x-aws-image-optimization",
                value: "v1.0",
                override: true,
              },
              { header: "vary", value: "accept", override: true },
            ],
          },
        }
      );
      imageDeliveryCacheBehaviorConfig.responseHeadersPolicy =
        imageResponseHeadersPolicy;
    }
    const imageDelivery = new cloudfront.Distribution(
      this,
      "imageDeliveryDistribution",
      {
        comment: "image optimization - image delivery",
        defaultBehavior: imageDeliveryCacheBehaviorConfig,
        certificate: props.certificate,
        domainNames: [config.imageDomain],
        httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      }
    );

    new CrossAccountRoute53RecordSet(this, "CrossAccountARecordImage", {
      delegationRoleName: `${config.sharedServicesRoute53CrossAccountDomainRole}-${config.environment}`,
      delegationRoleAccount: config.sharedServicesAccountNumber,
      hostedZoneId: config.sharedServicesHostedZoneId,
      resourceRecordSets: [
        {
          Name: config.imageDomain,
          Type: "A",
          AliasTarget: {
            DNSName: imageDelivery.distributionDomainName,
            HostedZoneId: "Z2FDTNDATAQYW2", // hardcoded by AWS: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-route53-recordset-aliastarget.html#cfn-route53-recordset-aliastarget-hostedzoneid
            EvaluateTargetHealth: false,
          },
        },
      ],
    });

    // ADD OAC between CloudFront and LambdaURL
    const oac = new cloudfront.CfnOriginAccessControl(this, "OAC", {
      originAccessControlConfig: {
        name: `oac${this.node.addr}`,
        description: "Origin Access Control for LambdaURL",
        originAccessControlOriginType: "lambda",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    });

    const cfnImageDelivery = imageDelivery.node.defaultChild as CfnDistribution;
    cfnImageDelivery.addPropertyOverride(
      `DistributionConfig.Origins.${
        STORE_TRANSFORMED_IMAGES === "true" ? "1" : "0"
      }.OriginAccessControlId`,
      oac.getAtt("Id")
    );

    this.lambda.addPermission("AllowCloudFrontServicePrincipal", {
      principal: new iam.ServicePrincipal("cloudfront.amazonaws.com"),
      action: "lambda:InvokeFunctionUrl",
      sourceArn: `arn:aws:cloudfront::${this.account}:distribution/${imageDelivery.distributionId}`,
    });

    new CfnOutput(this, "ImageDeliveryDomain", {
      description: "Domain name of image delivery",
      value: imageDelivery.distributionDomainName,
    });
  }
}
